import Notes from "../collections/notes";
import Notebooks from "../collections/notebooks";

class DB {
  constructor(context) {
    this.context = context;
  }
  async init() {
    this.notebooks = new Notebooks(this.context);
    this.notes = new Notes(this.context);
    await this.notes.init(this.notebooks);
    await this.notebooks.init(this.notes);
  }
}

export default DB;
