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
import Conflicts from "./conflicts";

class Database {
  constructor(context) {
    this.context = new Storage(context);
  }
  async init() {
    this.notebooks = new Notebooks(this.context);
    this.notes = new Notes(this.context);
    this.trash = new Trash(this.context);
    this.user = new User(this.context);
    this.tags = new Tags(this.context, "tags");
    this.colors = new Tags(this.context, "colors");
    this.delta = new Content(this.context, "delta");
    this.text = new Content(this.context, "text");
    await this.delta.init();
    await this.text.init();
    await this.tags.init();
    await this.colors.init();
    await this.notes.init(
      this.notebooks,
      this.trash,
      this.tags,
      this.colors,
      this.delta,
      this.text
    );
    await this.notebooks.init(this.notes, this.trash);
    await this.trash.init(this.notes, this.notebooks, this.delta, this.text);
    this.syncer = new Sync(this);
    this.vault = new Vault(this, this.context);
    this.conflicts = new Conflicts(this);
    this.lookup = new Lookup(this);
  }

  sync() {
    return this.syncer.start();
  }
}

export default Database;
