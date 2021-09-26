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

  async check() {
    let hasConflicts = await this._db.storage.read("hasConflicts");
    if (hasConflicts) {
      const mergeConflictError = new Error(
        "Merge conflicts detected. Please resolve all conflicts to continue syncing."
      );
      mergeConflictError.code = "MERGE_CONFLICT";
      throw mergeConflictError;
    }
  }
}
export default Conflicts;
