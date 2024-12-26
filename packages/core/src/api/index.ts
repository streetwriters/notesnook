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

import { Notes } from "../collections/notes.js";
import { Crypto, CryptoAccessor } from "../utils/crypto.js";
import { FileStorage, FileStorageAccessor } from "../database/fs.js";
import { Notebooks } from "../collections/notebooks.js";
import Trash from "../collections/trash.js";
import Sync, { SyncOptions } from "./sync/index.js";
import { Tags } from "../collections/tags.js";
import { Colors } from "../collections/colors.js";
import Vault from "./vault.js";
import Lookup from "./lookup.js";
import { Content } from "../collections/content.js";
import Backup from "../database/backup.js";
import Hosts from "../utils/constants.js";
import { EV, EVENTS } from "../common.js";
import { LegacySettings } from "../collections/legacy-settings.js";
import Migrations from "./migrations.js";
import UserManager from "./user-manager.js";
import http from "../utils/http.js";
import { Monographs } from "./monographs.js";
import { Offers } from "./offers.js";
import { Attachments } from "../collections/attachments.js";
import { Debug } from "./debug.js";
import { Mutex } from "async-mutex";
import { NoteHistory } from "../collections/note-history.js";
import MFAManager from "./mfa-manager.js";
import EventManager from "../utils/event-manager.js";
import { Pricing } from "./pricing.js";
import { logger } from "../logger.js";
import { Shortcuts } from "../collections/shortcuts.js";
import { Reminders } from "../collections/reminders.js";
import { Relations } from "../collections/relations.js";
import Subscriptions from "./subscriptions.js";
import {
  CompressorAccessor,
  ConfigStorageAccessor,
  ICompressor,
  IFileStorage,
  IStorage,
  KVStorageAccessor,
  StorageAccessor
} from "../interfaces.js";
import TokenManager from "./token-manager.js";
import { Attachment } from "../types.js";
import { Settings } from "../collections/settings.js";
import {
  DatabaseAccessor,
  DatabaseSchema,
  RawDatabaseSchema,
  SQLiteOptions,
  changeDatabasePassword,
  createDatabase,
  initializeDatabase
} from "../database/index.js";
import { Kysely, Transaction, sql } from "@streetwriters/kysely";
import { CachedCollection } from "../database/cached-collection.js";
import { Vaults } from "../collections/vaults.js";
import { KVStorage } from "../database/kv.js";
import { QueueValue } from "../utils/queue-value.js";
import { Sanitizer } from "../database/sanitizer.js";
import { createTriggers, dropTriggers } from "../database/triggers.js";
import { NNMigrationProvider } from "../database/migrations.js";
import { ConfigStorage } from "../database/config.js";
import { LazyPromise } from "../utils/lazy-promise.js";

type EventSourceConstructor = new (
  uri: string,
  init: EventSourceInit & { headers?: Record<string, string> }
) => EventSource;
type Options = {
  sqliteOptions: SQLiteOptions;
  storage: IStorage;
  eventsource?: EventSourceConstructor;
  fs: IFileStorage;
  compressor: () => Promise<ICompressor>;
  batchSize: number;
};

// const DIFFERENCE_THRESHOLD = 20 * 1000;
// const MAX_TIME_ERROR_FAILURES = 5;
class Database {
  isInitialized = false;
  eventManager = new EventManager();
  sseMutex = new Mutex();
  _fs?: FileStorage;
  _compressor?: Promise<ICompressor>;
  private databaseReady = new LazyPromise<
    Kysely<DatabaseSchema> | Transaction<DatabaseSchema>
  >();

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
    return (
      this._fs ||
      (this._fs = new FileStorage(this.options.fs, this.tokenManager))
    );
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
    return this._compressor || (this._compressor = this.options.compressor());
  };

  private _sql?: Kysely<DatabaseSchema>;
  sql: DatabaseAccessor = () => {
    // if (this._transaction) return this._transaction.value;

    if (!this._sql)
      throw new Error(
        "Database not initialized. Did you forget to call db.init()?"
      );
    return this._sql;
  };

  private _kv = new KVStorage(this.databaseReady.promise);
  kv: KVStorageAccessor = () => this._kv;
  private _config: ConfigStorage = new ConfigStorage(
    this.databaseReady.promise
  );
  config: ConfigStorageAccessor = () => this._config;

  private _transaction?: QueueValue<Transaction<DatabaseSchema>>;
  transaction = async (
    executor: (tr: Kysely<DatabaseSchema>) => Promise<void>
  ) => {
    await executor(this.sql());
    // if (this._transaction) {
    //   await executor(this._transaction.use()).finally(() =>
    //     this._transaction?.discard()
    //   );
    //   return;
    // }

    // return this.sql()
    //   .transaction()
    //   .execute(async (tr) => {
    //     this._transaction = new QueueValue(
    //       tr,
    //       () => (this._transaction = undefined)
    //     );
    //     await executor(this._transaction.use());
    //   })
    //   .finally(() => this._transaction?.discard());
  };

  options!: Options;
  eventSource?: EventSource | null;

  tokenManager = new TokenManager(this.kv);
  mfa = new MFAManager(this.tokenManager);
  subscriptions = new Subscriptions(this.tokenManager);
  offers = Offers;
  debug = new Debug();
  pricing = Pricing;

  user = new UserManager(this);
  syncer = new Sync(this);
  vault = new Vault(this);
  lookup = new Lookup(this);
  backup = new Backup(this);
  migrations = new Migrations(this);
  monographs = new Monographs(this);
  trash = new Trash(this);
  sanitizer = new Sanitizer(this.sql);

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
  vaults = new Vaults(this);
  settings = new Settings(this);

  /**
   * @deprecated only kept here for migration purposes
   */
  legacyTags = new CachedCollection(this.storage, "tags");
  /**
   * @deprecated only kept here for migration purposes
   */
  legacyColors = new CachedCollection(this.storage, "colors");
  /**
   * @deprecated only kept here for migration purposes
   */
  legacyNotes = new CachedCollection(this.storage, "notes");
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

  async reset() {
    await this.storage().clear();

    await dropTriggers(this.sql());
    for (const statement of [
      "PRAGMA writable_schema = 1",
      "DELETE FROM sqlite_master",
      "PRAGMA writable_schema = 0",
      "VACUUM",
      "PRAGMA integrity_check"
    ]) {
      await sql.raw(statement).execute(this.sql());
    }

    await initializeDatabase(
      this.sql().withTables(),
      new NNMigrationProvider(),
      "notesnook"
    );
    await this.onInit(this.sql() as unknown as Kysely<RawDatabaseSchema>);
    await this.initCollections();
    return true;
  }

  async changePassword(password?: string) {
    if (!this._sql) return;
    await changeDatabasePassword(this._sql, password);
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
    });
    EV.subscribe(EVENTS.userLoggedOut, async () => {
      await this.monographs.clear();
      await this.fs().clear();
      this.disconnectSSE();
    });

    this._sql = (await createDatabase<RawDatabaseSchema>("notesnook", {
      ...this.options.sqliteOptions,
      migrationProvider: new NNMigrationProvider(),
      onInit: (db) => this.onInit(db)
    })) as unknown as Kysely<DatabaseSchema>;
    this.databaseReady.resolve(this._sql);

    await this.sanitizer.init();

    await this.initCollections();

    await this.migrations.init();
    this.isInitialized = true;
    if (this.migrations.required()) {
      logger.warn("Database migration is required.");
    }
  }

  private async onInit(db: Kysely<RawDatabaseSchema>) {
    await createTriggers(db);
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
    await this.vaults.init();

    await this.trash.init();

    // legacy collections
    await this.legacyTags.init();
    await this.legacyColors.init();
    await this.legacyNotes.init();

    // we must not wait on network requests that's why
    // no await
    this.monographs.refresh().catch(logger.error);
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
      const forceReconnect = args && args.force;
      const EventSource = this.options.eventsource;
      if (
        !EventSource ||
        (!forceReconnect &&
          this.eventSource &&
          this.eventSource.readyState === this.eventSource.OPEN)
      )
        return;
      this.disconnectSSE();

      const token = await this.tokenManager.getAccessToken();
      if (!token) return;

      this.eventSource = new EventSource(`${Hosts.SSE_HOST}/sse`, {
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
              await this.tokenManager._refreshToken(true);
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
    return (await this.kv().read("lastSynced")) || 0;
  }

  setLastSynced(lastSynced: number) {
    return this.kv().write("lastSynced", lastSynced);
  }

  sync(options: SyncOptions) {
    return this.syncer.start(options);
  }

  hasUnsyncedChanges() {
    return this.syncer.sync.collector.hasUnsyncedChanges();
  }

  host(hosts: typeof Hosts) {
    Hosts.AUTH_HOST = hosts.AUTH_HOST || Hosts.AUTH_HOST;
    Hosts.API_HOST = hosts.API_HOST || Hosts.API_HOST;
    Hosts.SSE_HOST = hosts.SSE_HOST || Hosts.SSE_HOST;
    Hosts.SUBSCRIPTIONS_HOST =
      hosts.SUBSCRIPTIONS_HOST || Hosts.SUBSCRIPTIONS_HOST;
    Hosts.ISSUES_HOST = hosts.ISSUES_HOST || Hosts.ISSUES_HOST;
    Hosts.MONOGRAPH_HOST = hosts.MONOGRAPH_HOST || Hosts.MONOGRAPH_HOST;
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
