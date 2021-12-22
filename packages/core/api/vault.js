import { CHECK_IDS, EV, EVENTS, checkIsUserPremium } from "../common";

const ERASE_TIME = 1000 * 60 * 30;
var ERASER_TIMEOUT = null;
export default class Vault {
  get _password() {
    return this._vaultPassword;
  }

  set _password(value) {
    this._vaultPassword = value;
    if (value) {
      this._startEraser();
    }
  }

  _startEraser() {
    clearTimeout(ERASER_TIMEOUT);
    ERASER_TIMEOUT = setTimeout(() => {
      this._password = null;
    }, ERASE_TIME);
  }

  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
    this._storage = db.storage;
    this._key = "svvaads1212#2123";
    this._vaultPassword = null;
    this.ERRORS = {
      noVault: "ERR_NO_VAULT",
      vaultLocked: "ERR_VAULT_LOCKED",
      wrongPassword: "ERR_WRONG_PASSWORD",
    };
    EV.subscribe(EVENTS.userLoggedOut, () => {
      this._password = null;
    });
  }

  /**
   * Creates a new vault
   * @param {string} password The password
   * @returns {Promise<Boolean>}
   */
  async create(password) {
    if (!(await checkIsUserPremium(CHECK_IDS.vaultAdd))) return;

    const vaultKey = await this._storage.read("vaultKey");
    if (!vaultKey || !vaultKey.cipher || !vaultKey.iv) {
      const encryptedData = await this._storage.encrypt(
        { password },
        this._key
      );
      await this._storage.write("vaultKey", encryptedData);
      this._password = password;
    }
    return true;
  }

  /**
   * Unlocks the vault with the given password
   * @param {string} password The password
   * @throws  ERR_NO_VAULT | ERR_WRONG_PASSWORD
   * @returns {Promise<Boolean>}
   */
  async unlock(password) {
    const vaultKey = await this._storage.read("vaultKey");
    if (!(await this.exists(vaultKey))) throw new Error(this.ERRORS.noVault);
    try {
      await this._storage.decrypt({ password }, vaultKey);
    } catch (e) {
      throw new Error(this.ERRORS.wrongPassword);
    }
    this._password = password;
    return true;
  }

  async changePassword(oldPassword, newPassword) {
    if (await this.unlock(oldPassword)) {
      const lockedNotes = this._db.notes.locked;
      for (var note of lockedNotes) {
        await this._unlockNote(note, oldPassword, true);
      }
      await this._storage.remove("vaultKey");
      await this.create(newPassword);
      for (var note of lockedNotes) {
        await this._lockNote(note, newPassword);
      }
    }
  }

  async clear(password) {
    if (await this.unlock(password)) {
      for (var note of this._db.notes.locked) {
        await this._unlockNote(note, password, true);
      }
    }
  }

  async delete(deleteAllLockedNotes = false) {
    if (deleteAllLockedNotes) {
      await this._db.notes.remove(
        ...this._db.notes.locked.map((note) => note.id)
      );
    }
    await this._storage.remove("vaultKey");
    this._password = null;
  }

  /**
   * Locks (add to vault) a note
   * @param {string} noteId The id of the note to lock
   */
  async add(noteId) {
    if (!(await checkIsUserPremium(CHECK_IDS.vaultAdd))) return;

    await this._check();
    await this._lockNote({ id: noteId }, this._password);
    await this._db.noteHistory.clearSessions(noteId);
  }

  /**
   * Permanently unlocks (remove from vault) a note
   * @param {string} noteId The note id
   * @param {string} password The password to unlock note with
   */
  async remove(noteId, password) {
    const note = this._db.notes.note(noteId).data;
    await this._unlockNote(note, password, true);
  }

  /**
   * Temporarily unlock (open) a note
   * @param {string} noteId The note id
   * @param {string} password The password to open note with
   */
  async open(noteId, password) {
    const note = this._db.notes.note(noteId).data;
    const unlockedNote = await this._unlockNote(note, password, false);
    this._password = password;
    return unlockedNote;
  }

  /**
   * Saves a note in the vault
   * @param {{Object}} note The note to save into the vault
   */
  async save(note) {
    if (!note) return;
    // roll over erase timer
    this._startEraser();
    return await this._lockNote(note, this._password);
  }

  async exists(vaultKey) {
    if (!vaultKey) vaultKey = await this._storage.read("vaultKey");
    return vaultKey && vaultKey.cipher && vaultKey.iv;
  }

  // Private & internal methods

  /** @private */
  _locked() {
    return !this._password || !this._password.length;
  }

  /** @private */
  async _check() {
    if (!(await this.exists())) {
      throw new Error(this.ERRORS.noVault);
    }

    if (this._locked()) {
      throw new Error(this.ERRORS.vaultLocked);
    }
  }

  /** @private */
  async _encryptContent(contentId, sessionId, content, type, password) {
    let encryptedContent = await this._storage.encrypt(
      { password },
      JSON.stringify(content)
    );

    await this._db.content.add({
      id: contentId,
      sessionId,
      data: encryptedContent,
      type,
    });
  }

  /** @private */
  async _decryptContent(contentId, password) {
    let encryptedContent = await this._db.content.raw(contentId, false);

    let decryptedContent = await this._storage.decrypt(
      { password },
      encryptedContent.data
    );

    return { type: encryptedContent.type, data: JSON.parse(decryptedContent) };
  }

  /** @private */
  async _lockNote(note, password) {
    let { id, content: { type, data } = {}, contentId, sessionId } = note;

    // Case: when note is being newly locked
    if (!data || !type || !contentId) {
      note = this._db.notes.note(id).data;
      if (note.locked) return;
      contentId = note.contentId;
      let content = await this._db.content.raw(contentId, false);
      // NOTE:
      // At this point, the note already has all the attachments extracted
      // so we should just encrypt it as normal.
      data = content.data;
      type = content.type;
    } else {
      const content = await this._db.content.extractAttachments({
        data,
        type,
        noteId: id,
      });
      data = content.data;
      type = content.type;
    }

    await this._encryptContent(contentId, sessionId, data, type, password);

    return await this._db.notes.add({
      id,
      locked: true,
      headline: "",
      title: note.title,
      favorite: note.favorite,
    });
  }

  /** @private */
  async _unlockNote(note, password, perm = false) {
    let content = await this._decryptContent(note.contentId, password);

    if (perm) {
      await this._db.notes.add({
        id: note.id,
        locked: false,
        headline: note.headline,
        contentId: note.contentId,
        content,
      });
      // await this._db.content.add({ id: note.contentId, data: content });
      return;
    }

    return {
      ...note,
      content,
    };
  }

  /** @inner */
  async _getKey() {
    if (await this.exists()) return await this._storage.read("vaultKey");
  }

  /** @inner */
  async _setKey(vaultKey) {
    if (!vaultKey) return;
    await this._storage.write("vaultKey", vaultKey);
  }
}
