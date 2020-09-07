import Notes from "../collections/notes";
import Storage from "../database/storage";
import Notebooks from "../collections/notebooks";
import Trash from "../collections/trash";
import Tags from "../collections/tags";
import User from "../models/user";
import Sync from "./sync";
import Vault from "./vault";
import Lookup from "./lookup";
import Content from "../collections/content";
import Conflicts from "./sync/conflicts";
import EventManager from "../utils/event-manager";
import Session from "./session";
import { EventSourcePolyfill } from "event-source-polyfill";
import { HOST } from "../utils/constants";

class Database {
  constructor(context) {
    this.context = new Storage(context);
    this._syncInterval = 0;
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
    this.ev = new EventManager();
    this.ev.subscribeMulti(
      ["user:loggedIn", "user:loggedOut", "user:tokenRefreshed", "user:synced"],
      this._onUserStateChanged.bind(this)
    );

    this.session = new Session(this.context);
    this._validate();

    this.user = new User(this);
    this.syncer = new Sync(this);
    this.vault = new Vault(this);
    this.conflicts = new Conflicts(this);
    this.lookup = new Lookup(this);

    // collections
    /** @type {Notes} */
    this.notes = await Notes.new(this, "notes");
    /** @type {Notebooks} */
    this.notebooks = await Notebooks.new(this, "notebooks");
    /** @type {Tags} */
    this.tags = await Tags.new(this, "tags");
    /** @type {Tags} */
    this.colors = await Tags.new(this, "colors");
    /** @type {Content} */
    this.delta = await Content.new(this, "delta", false);
    /** @type {Content} */
    this.text = await Content.new(this, "text", false);
    /** @type {Trash} */
    this.trash = await Trash.new(this, "trash");

    await this.user.sync();
  }

  async _onUserStateChanged(user) {
    if (this.evtSource) {
      this.evtSource.close();
    }

    if (!user) return;
    if (!user.accessToken) {
      user = await this.user.get();
    }

    this.evtSource = new EventSourcePolyfill(`${HOST}/events`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });

    this.evtSource.onopen = function () {
      console.log("sse opened.");
    };

    this.evtSource.onmessage = async (event) => {
      const { type, data } = JSON.parse(event.data);
      switch (type) {
        case "upgrade":
          await this.user.set({
            notesnook: { ...user.notesnook, subscription: data },
          });
          this.ev.publish("user:upgraded", data);
          break;
        case "sync":
          await this.syncer.eventMerge(data);
          this.ev.publish("db:refresh");
          break;
      }
    };
  }

  sync() {
    return this.syncer.start();
  }
}

export default Database;
