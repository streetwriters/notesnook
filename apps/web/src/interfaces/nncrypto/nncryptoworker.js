export default class NNCryptoWorker {
  constructor() {
    this.isReady = false;
    this.initializing = false;
    this.promiseQueue = [];
  }
  async _initialize() {
    if (this.isReady) return;
    if (this.initializing)
      return await new Promise((resolve, reject) => {
        this.promiseQueue.push({ resolve, reject });
      });

    this.initializing = true;
    this.worker = new Worker("/crypto.worker.js");
    const buffer = Buffer.allocUnsafe(32);
    crypto.getRandomValues(buffer);
    const message = { seed: buffer.buffer };

    try {
      await this._communicate("load", message, [message.seed], false);
      this.isReady = true;

      this.promiseQueue.forEach(({ resolve }) => resolve());
    } catch (e) {
      this.isReady = false;

      this.promiseQueue.forEach(({ reject }) => reject(e));
    } finally {
      this.initializing = false;
      this.promiseQueue = [];
    }
  }

  _communicate(type, data, transferables = [], init = true) {
    return new Promise(async (resolve, reject) => {
      if (init) await this._initialize();
      const messageId = Math.random().toString(36).substr(2, 9);
      const onMessage = (e) => {
        const { type: _type, messageId: _mId, data } = e.data;
        if (_type === type && _mId === messageId) {
          this.worker.removeEventListener("message", onMessage);
          if (data.error) {
            console.error(data.error);
            return reject(data.error);
          }
          resolve(data);
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.postMessage(
        {
          type,
          data,
          messageId,
        },
        transferables
      );
    });
  }

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} data - the plaintext data
   * @param {boolean} compress
   */
  encrypt = (passwordOrKey, data) => {
    return this._communicate("encrypt", {
      passwordOrKey,
      data: { type: "plain", data },
    });
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{alg: string, salt: string, iv: string, cipher: string}} cipherData - the cipher data
   */
  decrypt = (passwordOrKey, cipherData) => {
    cipherData.output = "text";
    return this._communicate("decrypt", { passwordOrKey, cipher: cipherData });
  };

  deriveKey = (password, salt, exportKey = false) => {
    return this._communicate("deriveKey", { password, salt, exportKey });
  };

  hashPassword = (password, userId) => {
    return this._communicate("hashPassword", { password, userId });
  };
}
