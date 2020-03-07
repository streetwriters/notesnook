import Database from "./index";

const ERRORS = {
  noVault: "ERR_NO_VAULT",
  vaultLocked: "ERR_VAULT_LOCKED"
};

export default class Vault {
  /**
   *
   * @param {Database} database
   */
  constructor(database, context) {
    this.db = database;
    this.context = context;
    this.key = "Notesnook";
    this.password = "";
  }

  async create(password) {
    const lockKey = await this.context.read("lockKey");
    if (!lockKey || !lockKey.cipher || !lockKey.iv) {
      const encryptedData = await this.context.encrypt(password, this.key);
      await this.context.write("lockKey", encryptedData);
      this.password = password;
    }
    return true;
  }

  async unlock(password) {
    const lockKey = await this.context.read("lockKey");
    if (!this._exists(lockKey)) throw new Error("ERR_NO_VAULT");
    var data;
    try {
      data = await this.context.decrypt(password, lockKey);
    } catch (e) {
      throw new Error("ERR_WRNG_PWD");
    }
    if (data !== this.key) {
      throw new Error("ERR_WRNG_PWD");
    }
    this.password = password;
    return true;
  }

  async _exists(lockKey) {
    if (!lockKey) lockKey = await this.context.read("lockKey");
    return lockKey && lockKey.cipher && lockKey.iv;
  }

  async _locked() {
    return !this.password || !this.password.length;
  }

  async _check() {
    if (!(await this._exists())) {
      throw new Error(ERRORS.noVault);
    }

    if (await this._locked()) {
      throw new Error(ERRORS.vaultLocked);
    }
  }

  async add(id) {
    await this._check();
    await this.db.notes.note(id)._lock(this.password);
  }

  async remove(id, password) {
    if (await this.unlock(password)) {
      await this.db.notes.note(id)._unlock(this.password, true);
    }
  }

  async open(id, password) {
    if (await this.unlock(password)) {
      return this.db.notes.note(id)._unlock(password);
    }
  }
}
