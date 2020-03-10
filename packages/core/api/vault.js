import Database from "./index";

export default class Vault {
  /**
   *
   * @param {Database} database
   */
  constructor(database, context) {
    this._db = database;
    this._context = context;
    this._key = "Notesnook";
    this._password = "";
  }

  ERRORS = {
    noVault: "ERR_NO_VAULT",
    vaultLocked: "ERR_VAULT_LOCKED",
    wrongPassword: "ERR_WRONG_PASSWORD"
  };

  async create(password) {
    const lockKey = await this._context.read("lockKey");
    if (!lockKey || !lockKey.cipher || !lockKey.iv) {
      const encryptedData = await this._context.encrypt(password, this._key);
      await this._context.write("lockKey", encryptedData);
      this._password = password;
    }
    return true;
  }

  async unlock(password) {
    const lockKey = await this._context.read("lockKey");
    if (!(await this._exists(lockKey))) throw new Error("ERR_NO_VAULT");
    var data;
    try {
      data = await this._context.decrypt(password, lockKey);
    } catch (e) {
      throw new Error(this.ERRORS.wrongPassword);
    }
    if (data !== this._key) {
      throw new Error(this.ERRORS.wrongPassword);
    }
    this._password = password;
    return true;
  }

  async _exists(lockKey) {
    if (!lockKey) lockKey = await this._context.read("lockKey");
    return lockKey && lockKey.cipher && lockKey.iv;
  }

  async _locked() {
    return !this._password || !this._password.length;
  }

  async _check() {
    if (!(await this._exists())) {
      throw new Error(this.ERRORS.noVault);
    }

    if (await this._locked()) {
      throw new Error(this.ERRORS.vaultLocked);
    }
  }

  async add(id) {
    await this._check();
    const note = this._db.notes.note(id).data;
    await this._lockNote(id, note);
  }

  async remove(id, password) {
    if (await this.unlock(password)) {
      const note = this._db.notes.note(id).data;
      await this._unlockNote(note, true);
    }
  }

  async open(id, password) {
    if (await this.unlock(password)) {
      const note = this._db.notes.note(id).data;
      return this._unlockNote(note, false);
    }
  }

  async save(note) {
    if (!note) return;
    await this._check();
    let id = note.id || Date.now().toString() + "_note";
    return await this._lockNote(id, note);
  }

  _encryptText(text) {
    return this._context.encrypt(this._password, JSON.stringify({ text }));
  }
  async _decryptText(text) {
    const decrypted = await this._context.decrypt(this._password, text);
    return JSON.parse(decrypted);
  }

  async _encryptDelta(id, deltaArg) {
    if (!deltaArg) return;
    const delta = await this._context.encrypt(
      this._password,
      JSON.stringify(deltaArg)
    );
    await this._context.write(this._deltaId(id), delta);
  }

  async _decryptDelta(id) {
    const delta = await this._context.read(this._deltaId(id));
    const decrypted = await this._context.decrypt(this._password, delta);
    return JSON.parse(decrypted);
  }

  _deltaId(id) {
    return id + "_delta";
  }

  async _lockNote(id, note) {
    if (!note) return;

    let delta = note.content.delta;
    if (!delta) delta = await this._context.read(this._deltaId(id));
    await this._encryptDelta(id, delta);

    const content = await this._encryptText(note.content.text);

    return await this._db.notes.add({
      id,
      content,
      locked: true
    });
  }

  async _unlockNote(note, perm = false) {
    if (!note.locked) return;

    let decrypted = await this._decryptText(note.content);
    let delta = await this._decryptDelta(note.id);

    if (perm) {
      await this._db.notes.add({
        id: note.id,
        content: decrypted,
        locked: false
      });
      return await this._context.write(this._deltaId(note.id), delta);
    }

    return {
      ...note,
      content: { ...decrypted, delta }
    };
  }
}
