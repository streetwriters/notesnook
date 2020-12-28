import Notes from "../collections/notes";
import Storage from "../database/storage";
import Notebooks from "../collections/notebooks";
import Trash from "../collections/trash";
import Tags from "../collections/tags";
import Sync from "./sync";
import Vault from "./vault";
import Lookup from "./lookup";
import Content from "../collections/content";
import Backup from "../database/backup";
import Conflicts from "./sync/conflicts";
import Session from "./session";
import Constants from "../utils/constants";
import { EV } from "../common";
import Settings from "./settings";
import Migrations from "./migrations";
import Outbox from "./outbox";
import UserManager from "./user-manager";

/**
 * @type {EventSource}
 */
var NNEventSource;
class Database {
  /**
   *
   * @param {any} context
   * @param {EventSource} eventsource
   */
  constructor(context, eventsource) {
    this.context = new Storage(context);
    NNEventSource = eventsource;
    this._syncTimeout = 0;
  }

  async _validate() {
    if (!(await this.session.valid())) {
      throw new Error(
        "Your system clock is not setup correctly. Please adjust your date and time and then retry."
      );
    }
    await this.session.set();
  }

  async init() {
    EV.subscribeMulti(
      ["user:loggedIn", "user:loggedOut", "user:fetched"],
      this._onUserStateChanged.bind(this)
    );
    EV.subscribe("db:write", this._onDBWrite.bind(this));

    this.session = new Session(this.context);
    await this._validate();

    this.user = new UserManager(this);
    this.syncer = new Sync(this);
    this.vault = new Vault(this);
    this.conflicts = new Conflicts(this);
    this.lookup = new Lookup(this);
    this.backup = new Backup(this);
    this.settings = new Settings(this);
    this.migrations = new Migrations(this);
    this.outbox = new Outbox(this);

    // collections
    /** @type {Notes} */
    this.notes = await Notes.new(this, "notes", true, true);
    /** @type {Notebooks} */
    this.notebooks = await Notebooks.new(this, "notebooks");
    /** @type {Tags} */
    this.tags = await Tags.new(this, "tags");
    /** @type {Tags} */
    this.colors = await Tags.new(this, "colors");
    /** @type {Content} */
    this.content = await Content.new(this, "content", false);
    /** @type {Trash} */
    this.trash = await Trash.new(this, "trash");

    await this.settings.init();
    await this.outbox.init();
    await this.user.init();

    await this.migrations.init();
    await this.migrations.migrate();

    await this.user.fetchUser(true);
  }

  async _onUserStateChanged() {
    if (!NNEventSource) return;
    if (this.evtSource) {
      this.evtSource.close();
    }

    let token = await this.user.tokenManager.getAccessToken();
    this.evtSource = new NNEventSource(`${Constants.SSE_HOST}/sse`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    this.evtSource.onopen = function () {
      console.log("SSE: opened channel successfully!");
    };

    this.evtSource.onerror = function (error) {
      console.log("SSE: error:", error);
    };

    this.evtSource.onmessage = async (event) => {
      try {
        var { type, data } = JSON.parse(event.data);
        data = JSON.parse(data);
        console.log(type, data);
      } catch (e) {
        console.log("SSE: Unsupported message. Message = ", event.data);
        return;
      }

      switch (type) {
        case "upgrade":
          await this.user.set({
            subscription: data,
          });
          EV.publish("user:upgraded", data);
          break;
        case "userDeleted":
          await this.user.logout();
          EV.publish("user:deleted");
          break;
        case "userPasswordChanged":
          await this.user.logout();
          EV.publish("user:passwordChanged");
          break;
        case "emailConfirmed":
          const token = await this.context.read("token");
          await this.user.tokenManager._refreshToken(token);
          EV.publish("user:emailConfirmed");
          break;
        case "sync":
          await this.syncer.eventMerge(data);
          EV.publish("db:refresh");
          break;
      }
    };
  }

  async lastSynced() {
    return this.context.read("lastSynced");
  }

  _onDBWrite(item) {
    if (item.remote) {
      return;
    }
    clearTimeout(this._syncTimeout);
    this._syncTimeout = setTimeout(() => {
      EV.publish("db:sync");
    }, 15 * 1000);
  }

  sync(full = true, force = false) {
    return this.syncer.start(full, force);
  }

  /**
   *
   * @param {{AUTH_HOST: string, API_HOST: string, SSE_HOST: string}} hosts
   */
  host(hosts) {
    if (process.env.NODE_ENV !== "production") {
      Constants.AUTH_HOST = hosts.AUTH_HOST || Constants.AUTH_HOST;
      Constants.API_HOST = hosts.API_HOST || Constants.API_HOST;
      Constants.SSE_HOST = hosts.SSE_HOST || Constants.SSE_HOST;
    }
  }
}

export default Database;
