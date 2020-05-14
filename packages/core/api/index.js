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
    this.session = new Session(this.context);
    this._validate();

    this.user = new User(this);
    this.syncer = new Sync(this);
    this.vault = new Vault(this);
    this.conflicts = new Conflicts(this);
    this.lookup = new Lookup(this);
    this.ev = new EventManager();

    // collections
    /** @type {Notes} */
    this.notes = await Notes.new(this, "notes");
    /** @type {Notebooks} */
    this.notebooks = await Notebooks.new(this, "notebooks");
    /** @type {Tags} */
    this.tags = await Tags.new(this, "tags");
    /** @type {Tags} */
    this.colors = await Tags.new(this, "colors");
    /** @type {Trash} */
    this.trash = await Trash.new(this, "trash");
    /** @type {Content} */
    this.delta = await Content.new(this, "delta", false);
    /** @type {Content} */
    this.text = await Content.new(this, "text", false);

    if (this._syncInterval) clearInterval(this._syncInterval);
    this._syncInterval = setInterval(async () => {
      this.ev.publish("sync");
    }, 60 * 1000 * 3);
  }

  sync() {
    return this.syncer.start();
  }
}

export default Database;
