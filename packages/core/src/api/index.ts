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

import { Notes } from "../collections/notes";
import { Crypto, CryptoAccessor } from "../database/crypto";
import { FileStorage, FileStorageAccessor } from "../database/fs";
import { Notebooks } from "../collections/notebooks";
import Trash from "../collections/trash";
import { Tags } from "../collections/tags";
import { Colors } from "../collections/colors";
import Sync from "./sync";
import Vault from "./vault";
import Lookup from "./lookup";
import { Content } from "../collections/content";
import Backup from "../database/backup";
import Session from "./session";
import Hosts from "../utils/constants";
import { EV, EVENTS } from "../common";
import { LegacySettings } from "../collections/legacy-settings";
import Migrations from "./migrations";
import UserManager from "./user-manager";
import http from "../utils/http";
import { Monographs } from "./monographs";
import { Offers } from "./offers";
import { Attachments } from "../collections/attachments";
import { Debug } from "./debug";
import { Mutex } from "async-mutex";
import { NoteHistory } from "../collections/note-history";
import MFAManager from "./mfa-manager";
import EventManager from "../utils/event-manager";
import { Pricing } from "./pricing";
import { logger } from "../logger";
import { Shortcuts } from "../collections/shortcuts";
import { Reminders } from "../collections/reminders";
import { Relations } from "../collections/relations";
import Subscriptions from "./subscriptions";
import {
  CompressorAccessor,
  ICompressor,
  IFileStorage,
  IStorage,
  StorageAccessor
} from "../interfaces";
import TokenManager from "./token-manager";
import { Attachment } from "../types";
import { Settings } from "../collections/settings";
import {
  DatabaseAccessor,
  DatabaseSchema,
  SQLiteOptions,
  createDatabase
} from "../database";
import { Kysely, Transaction, sql } from "kysely";
import { CachedCollection } from "../database/cached-collection";

type EventSourceConstructor = new (
  uri: string,
  init: EventSourceInit & { headers?: Record<string, string> }
) => EventSource;
type Options = {
  sqliteOptions: SQLiteOptions;
  storage: IStorage;
  eventsource?: EventSourceConstructor;
  fs: IFileStorage;
  compressor: ICompressor;
  batchSize: number;
};

// const DIFFERENCE_THRESHOLD = 20 * 1000;
// const MAX_TIME_ERROR_FAILURES = 5;
class Database {
  isInitialized = false;
  eventManager = new EventManager();
  sseMutex = new Mutex();

  storage: StorageAccessor = () => {
    if (!this.options?.storage)
      throw new Error(
        "Database not initialized. Did you forget to call db.setup()?"
      );
    return this.options.storage;
  };

  fs: FileStorageAccessor = () => {
    if (!this.options?.fs)
      throw new Error(
        "Database not initialized. Did you forget to call db.setup()?"
      );
    return new FileStorage(this.options.fs, this.storage);
  };

  crypto: CryptoAccessor = () => {
    if (!this.options)
      throw new Error(
        "Database not initialized. Did you forget to call db.setup()?"
      );
    return new Crypto(this.storage);
  };

  compressor: CompressorAccessor = () => {
    if (!this.options?.compressor)
      throw new Error(
        "Database not initialized. Did you forget to call db.setup()?"
      );
    return this.options.compressor;
  };

  private _sql?: Kysely<DatabaseSchema>;
  sql: DatabaseAccessor = () => {
    if (this._transaction) return this._transaction;

    if (!this._sql)
      throw new Error(
        "Database not initialized. Did you forget to call db.init()?"
      );
    return this._sql;
  };

  private _transaction?: Transaction<DatabaseSchema>;
  private transactionMutex = new Mutex();
  transaction = (
    executor: (tr: Transaction<DatabaseSchema>) => void | Promise<void>
  ) => {
    return this.transactionMutex.runExclusive(() =>
      this.sql()
        .transaction()
        .execute(async (tr) => {
          this._transaction = tr;
          await executor(tr);
          this._transaction = undefined;
        })
        .finally(() => {
          this._transaction = undefined;
        })
    );
  };

  options!: Options;
  EventSource?: EventSourceConstructor;
  eventSource?: EventSource | null;

  session = new Session(this.storage);
  mfa = new MFAManager(this.storage);
  tokenManager = new TokenManager(this.storage);
  subscriptions = new Subscriptions(this.tokenManager);
  offers = new Offers();
  debug = new Debug();
  pricing = new Pricing();

  user = new UserManager(this);
  syncer = new Sync(this);
  vault = new Vault(this);
  lookup = new Lookup(this);
  backup = new Backup(this);
  settings = new Settings(this);
  migrations = new Migrations(this);
  monographs = new Monographs(this);
  trash = new Trash(this);

  notebooks = new Notebooks(this);
  tags = new Tags(this);
  colors = new Colors(this);
  content = new Content(this);
  attachments = new Attachments(this);
  noteHistory = new NoteHistory(this);
  shortcuts = new Shortcuts(this);
  reminders = new Reminders(this);
  relations = new Relations(this);
  notes = new Notes(this);

  /**
   * @deprecated only kept here for migration purposes
   */
  legacyTags = new CachedCollection(this.storage, "tags", this.eventManager);
  /**
   * @deprecated only kept here for migration purposes
   */
  legacyColors = new CachedCollection(
    this.storage,
    "colors",
    this.eventManager
  );
  /**
   * @deprecated only kept here for migration purposes
   */
  legacyNotes = new CachedCollection(this.storage, "notes", this.eventManager);
  /**
   * @deprecated only kept here for migration purposes
   */
  legacySettings = new LegacySettings(this);
  // constructor() {
  //   this.sseMutex = new Mutex();
  //   // this.lastHeartbeat = undefined; // { local: 0, server: 0 };
  //   // this.timeErrorFailures = 0;
  // }

  setup(options: Options) {
    this.options = options;
  }

  async _validate() {
    if (!(await this.session.valid())) {
      throw new Error(
        "Your system clock is not setup correctly. Please adjust your date and time and then retry."
      );
    }
    await this.session.set();
  }

  async reset() {
    await this.storage().clear();

    for (const statement of [
      "PRAGMA writable_schema = 1",
      "DELETE FROM sqlite_master",
      "PRAGMA writable_schema = 0",
      "VACUUM",
      "PRAGMA integrity_check"
    ]) {
      await sql.raw(statement).execute(this.sql());
    }
    await this.sql().destroy();
    this._sql = (await createDatabase(
      "notesnook",
      this.options.sqliteOptions
    )) as unknown as Kysely<DatabaseSchema>;
  }

  async init() {
    if (!this.options)
      throw new Error(
        "options not specified. Did you forget to call db.setup()?"
      );

    EV.subscribeMulti(
      [EVENTS.userLoggedIn, EVENTS.userFetched, EVENTS.tokenRefreshed],
      this.connectSSE,
      this
    );
    EV.subscribe(EVENTS.attachmentDeleted, async (attachment: Attachment) => {
      await this.fs().cancel(attachment.hash);
      await this.fs().cancel(attachment.hash);
    });
    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.monographs.clear();
      await this.fs().clear();
      this.disconnectSSE();
    });

    this._sql = (await createDatabase(
      "notesnook",
      this.options.sqliteOptions
    )) as unknown as Kysely<DatabaseSchema>;

    await this._validate();

    await this.initCollections();

    await this.migrations.init();
    this.isInitialized = true;
    if (this.migrations.required()) {
      logger.warn("Database migration is required.");
    }
  }

  async initCollections() {
    await this.legacySettings.init();
    // collections

    await this.settings.init();
    await this.notebooks.init();
    await this.tags.init();
    await this.colors.init();
    await this.content.init();
    await this.attachments.init();
    await this.noteHistory.init();
    await this.shortcuts.init();
    await this.reminders.init();
    await this.relations.init();
    await this.notes.init();

    await this.trash.init();

    // legacy collections
    await this.legacyTags.init();
    await this.legacyColors.init();
    await this.legacyNotes.init();

    // we must not wait on network requests that's why
    // no await
    this.monographs.refresh();
  }

  disconnectSSE() {
    if (!this.eventSource) return;
    this.eventSource.onopen = null;
    this.eventSource.onmessage = null;
    this.eventSource.onerror = null;
    this.eventSource.close();
    this.eventSource = null;
  }

  /**
   *
   * @param {{force: boolean, error: any}} args
   */
  async connectSSE(args?: { force: boolean }) {
    await this.sseMutex.runExclusive(async () => {
      this.eventManager.publish(EVENTS.databaseSyncRequested, true, false);

      const forceReconnect = args && args.force;
      if (
        !this.EventSource ||
        (!forceReconnect &&
          this.eventSource &&
          this.eventSource.readyState === this.eventSource.OPEN)
      )
        return;
      this.disconnectSSE();

      const token = await this.tokenManager.getAccessToken();
      if (!token) return;

      this.eventSource = new this.EventSource(`${Hosts.SSE_HOST}/sse`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      this.eventSource.onopen = async () => {
        console.log("SSE: opened channel successfully!");
      };

      this.eventSource.onerror = function (error) {
        console.log("SSE: error:", error);
      };

      this.eventSource.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          const data = JSON.parse(message.data);
          switch (message.type) {
            case "upgrade": {
              const user = await this.user.getUser();
              if (!user) break;
              user.subscription = data;
              await this.user.setUser(user);
              EV.publish(EVENTS.userSubscriptionUpdated, data);
              break;
            }
            case "logout": {
              await this.user.logout(true, data.reason || "Unknown.");
              break;
            }
            case "emailConfirmed": {
              await this.tokenManager._refreshToken(true);
              await this.user.fetchUser();
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
    return (await this.storage().read<number | undefined>("lastSynced")) || 0;
  }

  sync(full = true, force = false) {
    return this.syncer.start(full, force);
  }

  host(hosts: typeof Hosts) {
    if (process.env.NODE_ENV !== "production") {
      Hosts.AUTH_HOST = hosts.AUTH_HOST || Hosts.AUTH_HOST;
      Hosts.API_HOST = hosts.API_HOST || Hosts.API_HOST;
      Hosts.SSE_HOST = hosts.SSE_HOST || Hosts.SSE_HOST;
      Hosts.SUBSCRIPTIONS_HOST =
        hosts.SUBSCRIPTIONS_HOST || Hosts.SUBSCRIPTIONS_HOST;
      Hosts.ISSUES_HOST = hosts.ISSUES_HOST || Hosts.ISSUES_HOST;
    }
  }

  version() {
    return http.get(`${Hosts.API_HOST}/version`);
  }

  async announcements() {
    let url = `${Hosts.API_HOST}/announcements/active`;
    const user = await this.user.getUser();
    if (user) url += `?userId=${user.id}`;
    return http.get(url);
  }
}

export default Database;
