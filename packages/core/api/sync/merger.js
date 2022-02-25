import { migrations } from "../../migrations";
import { areAllEmpty } from "./utils";
import SparkMD5 from "spark-md5";
import setManipulator from "../../utils/set";
import { CURRENT_DATABASE_VERSION } from "../../common";

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

    if (!migrations[version]) {
      throw new Error(
        version > CURRENT_DATABASE_VERSION
          ? `Cannot migrate item to v${version}. Please update your client to the latest version.`
          : `Could not migrate item to v${version}. Please report this bug to the developers.`
      );
    }

    const migrate = migrations[version][type];
    if (migrate) return migrate(deserialized);
    return deserialized;
  }

  async _deserialize(item, migrate = true) {
    const decrypted = await this._db.storage.decrypt(this.key, item);
    if (!decrypted) {
      throw new Error("Decrypted item cannot be undefined.");
    }

    const deserialized = JSON.parse(decrypted);
    deserialized.remote = true;
    if (!migrate) return deserialized;
    return this._migrate(deserialized, item.v);
  }

  async _mergeItem(remoteItem, get, add) {
    remoteItem = await this._deserialize(remoteItem);
    let localItem = await get(remoteItem.id);

    if (!localItem || remoteItem.dateModified > localItem.dateModified) {
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
    remoteItem = await this._deserialize(remoteItem);
    let localItem = await get(remoteItem.id);

    if (!localItem) {
      await add(remoteItem);
    } else {
      const isResolved = localItem.dateResolved === remoteItem.dateModified;
      const isModified = localItem.dateModified > this._lastSynced;

      if (isModified && !isResolved) {
        // If time difference between local item's edits & remote item's edits
        // is less than 1 minute, we shouldn't trigger a merge conflict; instead
        // we will keep the most recently changed item.
        const timeDiff =
          Math.max(remoteItem.dateModified, localItem.dateModified) -
          Math.min(remoteItem.dateModified, localItem.dateModified);
        const ONE_MINUTE = 60 * 1000;
        if (timeDiff < ONE_MINUTE) {
          if (remoteItem.dateModified > localItem.dateModified) {
            await add(remoteItem);
          }
          return;
        }

        await markAsConflicted(localItem, remoteItem);
      } else if (!isResolved) {
        await add(remoteItem);
      }
    }
  }

  async _mergeArrayWithConflicts(array, mergeItem) {
    if (!array) return;
    for (let item of array) {
      await mergeItem(item);
    }
  }

  async merge(serverResponse, lastSynced) {
    if (!serverResponse) return false;
    this._lastSynced = lastSynced;
    const {
      notes = [],
      synced,
      notebooks = [],
      content = [],
      vaultKey,
      settings = [],
      attachments = [],
    } = serverResponse;

    if (synced || areAllEmpty(serverResponse)) return false;
    this.key = await this._db.user.getEncryptionKey();

    if (!this.key.key || !this.key.salt) {
      await this._db.user.logout(true, "User encryption key not generated.");
      throw new Error("User encryption key not generated. Please relogin.");
    }

    if (vaultKey) {
      await this._db.vault._setKey(await this._deserialize(vaultKey, false));
    }

    await this._mergeArrayWithConflicts(attachments, async (item) => {
      const remoteAttachment = await this._deserialize(item);
      const localAttachment = this._db.attachments.attachment(
        remoteAttachment.metadata.hash
      );
      if (
        localAttachment &&
        localAttachment.dateUploaded !== remoteAttachment.dateUploaded
      ) {
        const noteIds = localAttachment.noteIds.slice();
        const isRemoved = await this._db.attachments.remove(
          localAttachment.metadata.hash,
          true
        );
        if (!isRemoved)
          throw new Error(
            "Conflict could not be resolved in one of the attachments."
          );
        remoteAttachment.noteIds = setManipulator.union(
          remoteAttachment.noteIds,
          noteIds
        );
      }
      await this._db.attachments.merge(remoteAttachment);
    });

    await this._mergeArray(
      settings,
      () => this._db.settings.raw,
      (item) => this._db.settings.merge(item)
    );

    await this._mergeArray(
      notes,
      (id) => this._db.notes.note(id),
      (item) => this._db.notes.merge(item)
    );

    await this._mergeArray(
      notebooks,
      (id) => this._db.notebooks.notebook(id),
      (item) => this._db.notebooks.merge(item)
    );

    await this._mergeArrayWithConflicts(content, (item) =>
      this._mergeItemWithConflicts(
        item,
        (id) => this._db.content.raw(id),
        (item) => this._db.content.add(item),
        async (local, remote) => {
          let note = this._db.notes.note(local.noteId);
          if (!note || !note.data) return;
          note = note.data;

          const isRemoteObject = typeof remote.data === "object";
          const isLocalObject = typeof local.data === "object";
          const localHash = isLocalObject ? null : SparkMD5.hash(local.data);
          const remoteHash = isRemoteObject ? null : SparkMD5.hash(remote.data);
          if (!note.locked) {
            // reject all invalid states
            if (
              isRemoteObject || // no point in accepting invalid remote object
              !local.data ||
              !remote.data ||
              localHash === remoteHash
            )
              return;

            // if we have an invalid content locally but the remote one is valid,
            // let's accept the remote content.
            if (isLocalObject && !isRemoteObject) {
              await this._db.content.add({ id: local.id, ...remote });
              return;
            }
          }

          if (remote.deleted || local.deleted || note.locked) {
            // if note is locked or content is deleted we keep the most recent version.
            if (remote.dateModified > local.dateModified)
              await this._db.content.add({ id: local.id, ...remote });
          } else {
            // otherwise we trigger the conflicts
            await this._db.content.add({ ...local, conflicted: remote });
            await this._db.notes.add({ id: local.noteId, conflicted: true });
            await this._db.storage.write("hasConflicts", true);
          }
        }
      )
    );

    await this._db.notes.repairReferences();
    await this._db.notebooks.repairReferences();
    return true;
  }
}
export default Merger;
