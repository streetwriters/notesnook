import getId from "../utils/id";

export default class Vault {
  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
    this._context = db.context;
    this._key = "Notesnook";
    this._password = "";
    this.ERRORS = {
      noVault: "ERR_NO_VAULT",
      vaultLocked: "ERR_VAULT_LOCKED",
      wrongPassword: "ERR_WRONG_PASSWORD",
    };
  }

  /**
   * Creates a new vault (replacing if any older exists)
   * @param {string} password The password
   * @returns {Boolean}
   */
  async create(password) {
    const vaultKey = await this._context.read("vaultKey");
    if (!vaultKey || !vaultKey.cipher || !vaultKey.iv) {
      const encryptedData = await this._context.encrypt(
        { password },
        this._key
      );
      await this._context.write("vaultKey", encryptedData);
      this._password = password;
    }
    return true;
  }

  /**
   * Unlocks the vault with the given password
   * @param {string} password The password
   * @throws ERR_NO_VAULT | ERR_WRONG_PASSWORD
   * @returns {Boolean}
   */
  async unlock(password) {
    const vaultKey = await this._context.read("vaultKey");
    if (!(await this._exists(vaultKey))) throw new Error(this.ERRORS.noVault);
    var data;
    try {
      data = await this._context.decrypt({ password }, vaultKey);
    } catch (e) {
      throw new Error(this.ERRORS.wrongPassword);
    }
    if (data !== this._key) {
      throw new Error(this.ERRORS.wrongPassword);
    }
    this._password = password;
    return true;
  }

  /**
   * Locks (add to vault) a note
   * @param {string} noteId The id of the note to lock
   */
  async add(noteId) {
    await this._check();
    const note = this._db.notes.note(noteId).data;
    await this._lockNote(noteId, note);
  }

  /**
   * Permanently unlocks (remove from vault) a note
   * @param {string} noteId The note id
   * @param {string} password The password to unlock note with
   */
  async remove(noteId, password) {
    if (await this.unlock(password)) {
      const note = this._db.notes.note(noteId).data;
      await this._unlockNote(note, true);
    }
  }

  /**
   * Temporarily unlock (open) a note
   * @param {string} noteId The note id
   * @param {string} password The password to open note with
   */
  async open(noteId, password) {
    if (await this.unlock(password)) {
      const note = this._db.notes.note(noteId).data;
      return this._unlockNote(note, false);
    }
  }

  /**
   * Saves a note into the vault
   * @param {{Object}} note The note to save into the vault
   */
  async save(note) {
    if (!note) return;
    await this._check();
    let id = note.id || getId();
    return await this._lockNote(id, note);
  }

  // Private & internal methods

  /** @private */
  async _exists(vaultKey) {
    if (!vaultKey) vaultKey = await this._context.read("vaultKey");
    return vaultKey && vaultKey.cipher && vaultKey.iv;
  }

  /** @private */
  async _locked() {
    return !this._password || !this._password.length;
  }

  /** @private */
  async _check() {
    if (!(await this._exists())) {
      throw new Error(this.ERRORS.noVault);
    }

    if (await this._locked()) {
      throw new Error(this.ERRORS.vaultLocked);
    }
  }

  /** @private */
  async _encryptContent(content, ids) {
    let { text, delta } = { ...content };
    let { deltaId, textId } = ids;

    if (!delta.ops) delta = await this._db.delta.get(deltaId);
    if (text === textId) text = await this._db.text.get(textId);

    text = await this._context.encrypt({ password: this._password }, text);
    delta = await this._context.encrypt(
      { password: this._password },
      JSON.stringify(delta)
    );

    await this._db.text.add({ id: textId, data: text });
    await this._db.delta.add({ id: deltaId, data: delta });
  }

  /** @private */
  async _decryptContent(content) {
    let { text, delta } = { ...content };

    text = await this._db.text.get(text);
    text = await this._context.decrypt({ password: this._password }, text);

    delta = await this._db.text.get(delta);
    delta = await this._context.decrypt({ password: this._password }, delta);

    if (typeof delta === "string") delta = JSON.parse(delta);

    return {
      delta,
      text,
    };
  }

  /** @private */
  async _lockNote(id, note) {
    if (!note) return;
    let oldNote = this._db.notes.note(id);

    let deltaId = 0;
    let textId = 0;

    if (oldNote && oldNote.data.content) {
      deltaId = oldNote.data.content.delta;
      textId = oldNote.data.content.text;
    }

    await this._encryptContent(note.content, { textId, deltaId });

    return await this._db.notes.add({
      id,
      locked: true,
      headline: "",
    });
  }

  /** @private */
  async _unlockNote(note, perm = false) {
    if (!note.locked) return;

    let { delta, text } = await this._decryptContent(note.content);

    if (perm) {
      await this._db.notes.add({
        id: note.id,
        locked: false,
        content: {
          delta,
          text,
        },
      });
      //await this._db.delta.add({ id: note.content.delta, data: delta });
      // await this._db.text.add({ id: note.content.text, data: text });
      return;
    }

    return {
      ...note,
      content: { delta, text },
    };
  }

  /** @inner */
  async _getKey() {
    if (await this._exists()) return await this._context.read("vaultKey");
  }

  /** @inner */
  async _setKey(vaultKey) {
    if (!vaultKey) return;
    await this._context.write("vaultKey", vaultKey);
  }
}
