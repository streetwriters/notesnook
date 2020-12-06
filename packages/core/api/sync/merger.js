import { migrations } from "../../migrations";
import { areAllEmpty } from "./utils";

class Merger {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
  }

  _migrate(item, deserialized) {
    const version = item.v || 0;
    let type = deserialized.type;
    if (deserialized.data) type = "delta";
    const migrate = migrations[version][type];
    if (migrate) return migrate(deserialized);
    return deserialized;
  }

  async _deserialize(item) {
    const deserialized = JSON.parse(
      await this._db.context.decrypt(this.key, item)
    );
    deserialized.remote = true;
    return this._migrate(item, deserialized);
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

  async merge(serverResponse, lastSynced) {
    if (!serverResponse) return false;
    this._lastSynced = lastSynced;
    const {
      notes,
      synced,
      notebooks,
      content,
      tags,
      colors,
      trash,
      vaultKey,
      settings,
    } = serverResponse;

    if (synced || areAllEmpty(serverResponse)) return false;
    this.key = await this._db.user.key();

    if (vaultKey) {
      await this._db.vault._setKey(await this._deserialize(vaultKey));
    }

    await this._mergeArray(
      settings,
      () => this._db.settings.raw,
      this._db.settings.merge
    );

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
      content,
      (id) => this._db.content.raw(id),
      (item) => this._db.content.add(item),
      async (local, remote) => {
        // merge conflicts resolver
        const note = this._db.notes.note(local.noteId).data;

        if (local.deleted || note.locked) {
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
