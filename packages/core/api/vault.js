import getId from "../utils/id";

export default class Vault {
  /**
   *
   * @param {import('./index').default} database
   */
  constructor(database, context) {
    this._db = database;
    this._context = context;
    this._key = "Notesnook";
    this._password = "";
    this.ERRORS = {
      noVault: "ERR_NO_VAULT",
      vaultLocked: "ERR_VAULT_LOCKED",
      wrongPassword: "ERR_WRONG_PASSWORD",
    };
  }

  async create(password) {
    const lockKey = await this._context.read("lockKey");
    if (!lockKey || !lockKey.cipher || !lockKey.iv) {
      const encryptedData = await this._context.encrypt(
        { password },
        this._key
      );
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
      data = await this._context.decrypt({ password }, lockKey);
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
    //const note = this._db.notes.note(id).data;
    await this._lockNote(id);
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
    let id = note.id || getId();
    return await this._lockNote(id, note);
  }

  async _encryptContent(content, ids) {
    let { text, delta } = { ...content };
    let { deltaId, textId } = ids;

    if (!delta.ops) delta = await this._db.delta.get(deltaId);
    if (text === textId) text = await this._db.text.get(textId);

    text = await this._context.encrypt({ password: this._password }, text);
    delta = await this._context.encrypt({ password: this._password }, delta);

    await this._db.text.add({ id: textId, data: text });
    await this._db.delta.add({ id: deltaId, data: delta });
  }

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

  async _lockNote(id, note) {
    note = note || this._db.notes.note(id).data;

    let deltaId = 0;
    let textId = 0;

    if (note && note.content) {
      deltaId = note.content.delta;
      textId = note.content.text;
    }

    await this._encryptContent(note.content, { textId, deltaId });

    return await this._db.notes.add({
      id,
      locked: true,
    });
  }

  async _unlockNote(note, perm = false) {
    if (!note.locked) return;

    let { delta, text } = await this._decryptContent(note.content);

    if (perm) {
      await this._db.notes.add({
        id: note.id,
        locked: false,
      });
      await this._db.delta.add({ id: note.content.delta, data: delta });
      await this._db.text.add({ id: note.content.text, data: text });
      return;
    }

    return {
      ...note,
      content: { delta, text },
    };
  }
}
