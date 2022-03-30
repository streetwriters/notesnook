class Conflicts {
  /**
   *
   * @param {import('../index').default} db
   */
  constructor(db) {
    this._db = db;
  }

  async recalculate() {
    if (this._db.notes.conflicted.length <= 0) {
      await this._db.storage.write("hasConflicts", false);
    }
  }

  check() {
    return this._db.storage.read("hasConflicts");
  }
}
export default Conflicts;
