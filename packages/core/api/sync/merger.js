import Database from "../index";
import { areAllEmpty } from "./utils";

class Merger {
  /**
   *
   * @param {Database} db
   */
  constructor(db, lastSynced) {
    this._db = db;
    this._lastSynced = lastSynced;
  }

  async _deserialize(item) {
    const deserialized = JSON.parse(
      await this._db.context.decrypt({ key: this.key }, item)
    );
    deserialized.remote = true;
    return deserialized;
  }

  async _mergeItem(remoteItem, get, add) {
    let localItem = await get(remoteItem.id);
    remoteItem = await this._deserialize(remoteItem);
    if (!localItem || remoteItem.dateEdited > localItem.dateEdited) {
      await add(remoteItem);
    }
  }

  async _mergeArray(array, get, set) {
    if (!array) return;
    return Promise.all(
      array.map(async (item) => await this._mergeItem(item, get, set))
    );
  }

  async _mergeItemWithConflicts(remoteItem, get, add, resolve) {
    let localItem = await get(remoteItem.id);

    remoteItem = await this._deserialize(remoteItem);
    if (!localItem) {
      await add(remoteItem);
    } else if (!localItem.resolved && localItem.dateEdited > this._lastSynced) {
      await resolve(localItem, remoteItem);
    } else if (localItem.resolved) {
      await add({ ...localItem, resolved: false });
    } else {
      await add(remoteItem);
    }
  }

  async _mergeArrayWithConflicts(array, get, set, resolve) {
    if (!array) return;
    return Promise.all(
      array.map(
        async (item) =>
          await this._mergeItemWithConflicts(item, get, set, resolve)
      )
    );
  }

  async merge(serverResponse) {
    if (!serverResponse) return false;
    const {
      notes,
      synced,
      notebooks,
      delta,
      text,
      tags,
      colors,
      trash,
    } = serverResponse;

    if (synced || areAllEmpty(serverResponse)) return false;
    this.key = await this._db.user.key();

    await this._mergeArray(
      notes,
      (id) => this._db.notes.note(id),
      (item) => this._db.notes.add(item)
    );
    await this._mergeArray(
      notebooks,
      (id) => this._db.notebooks.notebook(id),
      (item) => this._db.notebooks.add(item)
    );

    await this._mergeArrayWithConflicts(
      delta,
      (id) => this._db.delta.raw(id),
      (item) => this._db.delta.add(item),
      async (local, remote) => {
        await this._db.delta.add({ ...local, conflicted: remote });
        await this._db.notes.add({ id: local.noteId, conflicted: true });
        await this._db.context.write("hasConflicts", true);
      }
    );

    await this._mergeArray(
      text,
      (id) => this._db.text.raw(id),
      (item) => this._db.text.add(item)
    );

    await this._mergeArray(
      tags,
      (id) => this._db.tags.tag(id),
      (item) => this._db.tags.merge(item)
    );

    await this._mergeArray(
      colors,
      (id) => this._db.colors.tag(id),
      (item) => this._db.colors.merge(item)
    );

    await this._mergeArray(
      trash,
      () => undefined,
      (item) => this._db.trash.add(item)
    );

    return true;
  }
}
export default Merger;
