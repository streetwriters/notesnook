import { migrations } from "../../migrations";
import SparkMD5 from "spark-md5";
import setManipulator from "../../utils/set";
import { CURRENT_DATABASE_VERSION } from "../../common";
import { logger } from "../../logger";

class Merger {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this.logger = logger.scope("Merger");

    this._mergeDefinition = {
      settings: {
        threshold: 1000,
        get: () => this._db.settings.raw,
        set: (item) => this._db.settings.merge(item),
        conflict: (_local, remote) => this._db.settings.merge(remote),
      },
      note: {
        get: (id) => this._db.notes.note(id),
        set: (item) => this._db.notes.merge(item),
      },
      notebook: {
        threshold: 1000,
        get: (id) => this._db.notebooks.notebook(id),
        set: (item) => this._db.notebooks.merge(item),
        conflict: (_local, remote) => this._db.notebooks.merge(remote),
      },
      content: {
        threshold: process.env.NODE_ENV === "test" ? 6 * 1000 : 60 * 1000,
        get: (id) => this._db.content.raw(id),
        set: (item) => this._db.content.add(item),
        conflict: async (local, remote) => {
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
            if (remote.dateModified > local.dateModified)
              await this._db.content.add({ id: local.id, ...remote });
          } else {
            // otherwise we trigger the conflicts
            await this._db.content.add({ ...local, conflicted: remote });
            await this._db.notes.add({ id: local.noteId, conflicted: true });
            await this._db.storage.write("hasConflicts", true);
          }
        },
      },
      attachment: {
        set: async (item) => {
          const remoteAttachment = await this._deserialize(item);
          if (remoteAttachment.deleted) {
            await this._db.attachments.merge(remoteAttachment);
            return;
          }

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
        },
      },
      vaultKey: {
        set: async (vaultKey) =>
          this._db.vault._setKey(await this._deserialize(vaultKey, false)),
      },
    };
  }

  _migrate(deserialized, version) {
    // it is a locked note, bail out.
    if (deserialized.alg && deserialized.cipher) return deserialized;

    let type = deserialized.type;
    // temporary fix for streetwriters/notesnook#751
    if (type === "content") {
      type = "tiptap";
      deserialized.type = type;
    }

    if (!migrations[version]) {
      throw new Error(
        version > CURRENT_DATABASE_VERSION
          ? `Cannot migrate item to v${version}. Please update your client to the latest version.`
          : `Could not migrate item to v${version}. Please report this bug to the developers.`
      );
    }

    const migrate = migrations[version][type];
    if (migrate) {
      return migrate(deserialized);
    }
    return deserialized;
  }

  async _deserialize(item, migrate = true) {
    const decrypted = await this._db.storage.decrypt(this.key, item);
    if (!decrypted) {
      throw new Error("Decrypted item cannot be undefined.");
    }

    const deserialized = JSON.parse(decrypted);
    deserialized.remote = true;
    deserialized.synced = true;
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

  async _mergeItemWithConflicts(
    remoteItem,
    get,
    add,
    markAsConflicted,
    threshold
  ) {
    remoteItem = await this._deserialize(remoteItem);
    let localItem = await get(remoteItem.id);

    if (!localItem) {
      await add(remoteItem);
    } else {
      const isResolved = localItem.dateResolved === remoteItem.dateModified;
      const isModified = localItem.dateModified > this._lastSynced;
      if (isModified && !isResolved) {
        // If time difference between local item's edits & remote item's edits
        // is less than threshold, we shouldn't trigger a merge conflict; instead
        // we will keep the most recently changed item.
        const timeDiff =
          Math.max(remoteItem.dateModified, localItem.dateModified) -
          Math.min(remoteItem.dateModified, localItem.dateModified);

        if (timeDiff < threshold) {
          if (remoteItem.dateModified > localItem.dateModified) {
            await add(remoteItem);
          }
          return;
        }

        this.logger.info("Conflict detected", {
          itemId: remoteItem.id,
          isResolved,
          isModified,
          timeDiff,
          remote: remoteItem.dateModified,
          local: localItem.dateModified,
        });

        await markAsConflicted(localItem, remoteItem);
      } else if (!isResolved) {
        await add(remoteItem);
      }
    }
  }

  async mergeItem(type, item) {
    this._lastSynced = await this._db.lastSynced();

    const definition = this._mergeDefinition[type];
    if (!type || !item || !definition) return;

    if (!this.key) this.key = await this._db.user.getEncryptionKey();
    if (!this.key.key || !this.key.salt) {
      await this._db.user.logout(true, "User encryption key not generated.");
      throw new Error("User encryption key not generated. Please relogin.");
    }

    if (definition.conflict) {
      await this._mergeItemWithConflicts(
        item,
        definition.get,
        definition.set,
        definition.conflict,
        definition.threshold
      );
    } else if (definition.get && definition.set) {
      await this._mergeItem(item, definition.get, definition.set);
    } else if (!definition.get && definition.set) {
      await definition.set(item);
    }
  }
}
export default Merger;
