import Database from "./index";

class Conflicts {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this._db = db;
  }

  async recalculate() {
    if (this._db.notes.conflicted.length <= 0) {
      await this._db.context.write("hasConflicts", false);
    }
  }
}
export default Conflicts;
