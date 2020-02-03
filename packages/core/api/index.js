import Notes from "../collections/notes";

class DB {
  constructor(context) {
    this.context = context;
  }
  async init() {
    this.notes = new Notes(this.context);
  }
}

export default DB;
