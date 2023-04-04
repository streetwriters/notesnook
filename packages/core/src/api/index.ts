/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Notes from "../collections/notes";
import FileStorage from "../database/fs";
import Notebooks from "../collections/notebooks";
import Trash from "../collections/trash";
import { Tags } from "../collections/tags";
import Sync from "./sync";
import Vault from "./vault";
import { Lookup } from "./lookup";
import Content from "../collections/content";
import Backup from "../database/backup";
import { SystemClock } from "./system-clock";
import Constants from "../utils/constants";
import { EV, EVENTS } from "../common";
import Settings from "./settings";
import Migrations from "./migrations";
import Outbox from "./outbox";
import UserManager from "./user-manager";
import http from "../utils/http";
import Monographs from "./monographs";
import Attachments from "../collections/attachments";
import { Mutex } from "async-mutex";
import NoteHistory from "../collections/note-history";
import MFAManager from "./mfa-manager";
import EventManager from "../utils/event-manager";
import { logger } from "../logger";
import Shortcuts from "../collections/shortcuts";
import Reminders from "../collections/reminders";
import { Relations } from "../collections/relations";
import { Subscriptions } from "./subscriptions";
import { ICompressor, IFileStorage, IStorage } from "../interfaces";
import { TokenManager } from "./token-manager";

// const DIFFERENCE_THRESHOLD = 20 * 1000;
// const MAX_TIME_ERROR_FAILURES = 5;
type Options = {
  storage: IStorage;
  eventsource: new (
    uri: string,
    init: EventSourceInit & { headers?: Record<string, string> }
  ) => EventSource;
  fs: IFileStorage;
  compressor: ICompressor;
};

class Database {
  private readonly sseMutex = new Mutex();
  private sseConnection: EventSource | null = null;
  private readonly fileStorage: FileStorage;
  private readonly tokenManager: TokenManager;

  readonly notes: Notes;
  readonly relations: Relations;
  readonly tags: Tags;
  readonly eventManager = new EventManager();
  readonly subscriptions: Subscriptions;

  constructor(private readonly options: Options) {
    this.notes = new Notes(options.storage);
    this.relations = new Relations(options.storage);
    this.tags = new Tags(options.storage);

    this.fileStorage = new FileStorage(options.fs, options.storage);
    this.tokenManager = new TokenManager(options.storage);
    this.subscriptions = new Subscriptions(this.tokenManager);
  }

  async init() {
    await this.isSystemClockValid();

    EV.subscribeMulti(
      [EVENTS.userLoggedIn, EVENTS.userFetched, EVENTS.tokenRefreshed],
      this.connectSSE,
      this
    );
    EV.subscribe(EVENTS.attachmentDeleted, async (attachment) => {
      await this.fileStorage.cancel(attachment.metadata.hash);
    });
    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.monographs.deinit();
      await this.fs.clear();
      this.disconnectSSE();
    });
    EV.subscribe(EVENTS.databaseCollectionInitiated, async (collectionName) => {
      switch (collectionName) {
        case "notes": {
          await this.monographs.init();
          await this.trash.init();
          await this.relations.cleanup();
          break;
        }
      }
    });

    this.user = new UserManager(this.storage, this);
    this.mfa = new MFAManager(this.storage, this);
    this.syncer = new Sync(this);
    this.vault = new Vault(this);
    this.lookup = new Lookup(this);
    this.backup = new Backup(this);
    this.settings = new Settings(this);
    this.migrations = new Migrations(this);
    this.outbox = new Outbox(this);
    this.monographs = new Monographs(this);

    // collections
    /** @type {Notebooks} */
    this.notebooks = await Notebooks.new(this, "notebooks");
    /** @type {Tags} */
    this.tags = await Tags.new(this, "tags");
    /** @type {Tags} */
    this.colors = await Tags.new(this, "colors");
    /** @type {Content} */
    this.content = await Content.new(this, "content", false);
    /** @type {Attachments} */
    this.attachments = await Attachments.new(this, "attachments");
    /**@type {NoteHistory} */
    this.noteHistory = await NoteHistory.new(this, "notehistory", false);
    /**@type {Shortcuts} */
    this.shortcuts = await Shortcuts.new(this, "shortcuts");
    /**@type {Reminders} */
    this.reminders = await Reminders.new(this, "reminders");
    /**@type {Relations} */
    this.relations = await Relations.new(this, "relations");

    this.trash = new Trash(this);

    await this.settings.init();
    await this.outbox.init();
    await this.user.init();
    await this.migrations.init();

    if (this.migrations.required()) {
      logger.warn("Database migration is required.");
    }
  }

  disconnectSSE() {
    if (!this.sseConnection) return;
    this.sseConnection.onopen = null;
    this.sseConnection.onmessage = null;
    this.sseConnection.onerror = null;
    this.sseConnection.close();
    this.sseConnection = null;
  }

  async connectSSE(args?: { force: boolean }) {
    await this.sseMutex.runExclusive(async () => {
      this.eventManager.publish(EVENTS.databaseSyncRequested, true, false);

      const forceReconnect = args && args.force;
      if (
        !forceReconnect &&
        this.sseConnection &&
        this.sseConnection.readyState === this.sseConnection.OPEN
      )
        return;
      this.disconnectSSE();

      const token = await this.user.tokenManager.getAccessToken();
      if (!token) return;

      this.sseConnection = new this.options.eventsource(
        `${Constants.SSE_HOST}/sse`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      this.sseConnection.onopen = async () => {
        console.log("SSE: opened channel successfully!");
      };

      this.sseConnection.onerror = function (error) {
        console.log("SSE: error:", error);
      };

      this.sseConnection.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          const data = JSON.parse(message.data);

          switch (message.type) {
            // TODO: increase reliablity for this.
            // case "heartbeat": {
            //   const { t: serverTime } = data;
            //   const localTime = Date.now();

            //   if (!this.lastHeartbeat) {
            //     this.lastHeartbeat = { local: localTime, server: serverTime };
            //     break;
            //   }

            //   const timeElapsed = {
            //     local: localTime - this.lastHeartbeat.local,
            //     server: serverTime - this.lastHeartbeat.server,
            //   };
            //   const travelTime = timeElapsed.local - timeElapsed.server;
            //   const actualTime = localTime - travelTime;

            //   const diff = actualTime - serverTime;

            //   // Fail several times consecutively before raising an error. This is done to root out
            //   // false positives.
            //   if (Math.abs(diff) > DIFFERENCE_THRESHOLD) {
            //     if (this.timeErrorFailures >= MAX_TIME_ERROR_FAILURES) {
            //       EV.publish(EVENTS.systemTimeInvalid, { serverTime, localTime });
            //     } else this.timeErrorFailures++;
            //   } else this.timeErrorFailures = 0;

            //   this.lastHeartbeat.local = localTime;
            //   this.lastHeartbeat.server = serverTime;
            //   break;
            // }
            case "upgrade": {
              const user = await this.user.getUser();
              user.subscription = data;
              await this.user.setUser(user);
              EV.publish(EVENTS.userSubscriptionUpdated, data);
              break;
            }
            case "userDeleted": {
              await this.user.logout(false, "Account Deleted");
              break;
            }
            case "userEmailChanged": {
              await this.user.logout(true, "Email changed");
              break;
            }
            case "userPasswordChanged": {
              await this.user.logout(true, "Password changed");
              break;
            }
            case "emailConfirmed": {
              const token = await this.storage.read("token");
              await this.user.tokenManager._refreshToken(token);
              await this.user.fetchUser(true);
              EV.publish(EVENTS.userEmailConfirmed);
              break;
            }
          }
        } catch (e) {
          console.log("SSE: Unsupported message. Message = ", event.data);
          return;
        }
      };
    });
  }

  async lastSynced() {
    return (await this.options.storage.read<number>("lastSynced")) || 0;
  }

  sync(full = true, force = false) {
    return this.syncer.start(full, force);
  }

  /**
   *
   * @param {{AUTH_HOST: string, API_HOST: string, SSE_HOST: string, SUBSCRIPTIONS_HOST: string, ISSUES_HOST: string}} hosts
   */
  host(hosts) {
    if (process.env.NODE_ENV !== "production") {
      Constants.AUTH_HOST = hosts.AUTH_HOST || Constants.AUTH_HOST;
      Constants.API_HOST = hosts.API_HOST || Constants.API_HOST;
      Constants.SSE_HOST = hosts.SSE_HOST || Constants.SSE_HOST;
      Constants.SUBSCRIPTIONS_HOST =
        hosts.SUBSCRIPTIONS_HOST || Constants.SUBSCRIPTIONS_HOST;
      Constants.ISSUES_HOST = hosts.ISSUES_HOST || Constants.ISSUES_HOST;
    }
  }

  version() {
    return http.get(`${Constants.API_HOST}/version`);
  }

  async announcements() {
    let url = `${Constants.API_HOST}/announcements/active`;
    const user = await this.user.getUser();
    if (user) url += `?userId=${user.id}`;
    return http.get(url);
  }

  private async isSystemClockValid() {
    const systemClock = new SystemClock(this.options.storage);
    if (!(await systemClock.valid())) {
      throw new Error(
        "Your system clock is not setup correctly. Please adjust your date and time and then retry."
      );
    }
    await systemClock.set();
  }
}

export default Database;
