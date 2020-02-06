import Notes from "../collections/notes";
import Notebooks from "../collections/notebooks";
import Trash from "../collections/trash";

class DB {
  constructor(context) {
    this.context = context;
  }
  async init() {
    this.notebooks = new Notebooks(this.context);
    this.notes = new Notes(this.context);
    this.trash = new Trash(this.context);
    await this.notes.init(this.notebooks, this.trash);
    await this.notebooks.init(this.notes, this.trash);
    await this.trash.init(this.notes, this.notebooks);
  }
}

export default DB;
