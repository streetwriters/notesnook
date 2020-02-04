import Notes from "../collections/notes";
import Notebooks from "../collections/notebooks";

class DB {
  constructor(context) {
    this.context = context;
  }
  async init() {
    this.notes = new Notes(this.context);
    this.notebooks = new Notebooks(this.context);
  }
}

export default DB;
