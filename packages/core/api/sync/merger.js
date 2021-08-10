import { migrations } from "../../migrations";
import { areAllEmpty } from "./utils";
import SparkMD5 from "spark-md5";

class Merger {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
  }

  _migrate(deserialized, version) {
    // it is a locked note, bail out.
    if (deserialized.alg && deserialized.cipher) return deserialized;

    let type = deserialized.type;
    if (!type && deserialized.data) type = "tiny";

    const migrate = migrations[version][type];
    if (migrate) return migrate(deserialized);
    return deserialized;
  }

  async _deserialize(item, migrate = true) {
    const deserialized = JSON.parse(
      await this._db.context.decrypt(this.key, item)
    );
    deserialized.remote = true;
    if (!migrate) return deserialized;
    return this._migrate(deserialized, item.v);
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
    for (let item of array) {
      await this._mergeItem(item, get, set);
    }
  }

  async _mergeItemWithConflicts(remoteItem, get, add, markAsConflicted) {
    let localItem = await get(remoteItem.id);

    remoteItem = await this._deserialize(remoteItem);
    if (!localItem) {
      await add(remoteItem);
    } else if (
      localItem.dateResolved !== remoteItem.dateEdited &&
      localItem.dateEdited > this._lastSynced
    ) {
      await markAsConflicted(localItem, remoteItem);
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

  async merge(serverResponse, lastSynced) {
    if (!serverResponse) return false;
    this._lastSynced = lastSynced;
    const { notes, synced, notebooks, content, trash, vaultKey, settings } =
      serverResponse;

    if (synced || areAllEmpty(serverResponse)) return false;
    this.key = await this._db.user.getEncryptionKey();

    if (vaultKey) {
      await this._db.vault._setKey(await this._deserialize(vaultKey, false));
    }

    await this._mergeArray(
      settings,
      () => this._db.settings.raw,
      (item) => this._db.settings.merge(item)
    );

    await this._mergeArray(
      notes,
      (id) => this._db.notes.note(id),
      (item) => this._db.notes.add(item)
    );

    await this._mergeArray(
      notebooks,
      (id) => this._db.notebooks.notebook(id),
      (item) => this._db.notebooks.merge(item)
    );

    await this._mergeArrayWithConflicts(
      content,
      (id) => this._db.content.raw(id),
      (item) => this._db.content.add(item),
      async (local, remote) => {
        let note = this._db.notes.note(local.noteId);
        if (!note || !note.data) return;
        note = note.data;

        // if hashes are equal do nothing
        if (
          !note.locked &&
          (!remote ||
            !local ||
            !local.data ||
            !remote.data ||
            remote.data === "undefined" || //TODO not sure about this
            SparkMD5.hash(local.data) === SparkMD5.hash(remote.data))
        )
          return;

        if (remote.deleted || local.deleted || note.locked) {
          // if note is locked or content is deleted we keep the most recent version.
          if (remote.dateEdited > local.dateEdited)
            await this._db.content.add({ id: local.id, ...remote });
        } else {
          // otherwise we trigger the conflicts
          await this._db.content.add({ ...local, conflicted: remote });
          await this._db.notes.add({ id: local.noteId, conflicted: true });
          await this._db.context.write("hasConflicts", true);
        }
      }
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
