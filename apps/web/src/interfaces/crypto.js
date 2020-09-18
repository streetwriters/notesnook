class Crypto {
  isReady = false;
  constructor() {
    this.sodium = undefined;
  }
  async _initialize() {
    if (this.isReady) return;
    return new Promise(async (resolve) => {
      window.sodium = {
        onload: (_sodium) => {
          if (this.isReady) return;
          this.isReady = true;
          this.sodium = _sodium;
          loadScript("crypto.worker.js").then(resolve);
        },
      };
      await loadScript("sodium.js");
    });
  }

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string|Object} data - the plaintext data
   */
  encrypt = async (passwordOrKey, data) => {
    await this._initialize();
    return global.ncrypto.encrypt.call(this, passwordOrKey, data);
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{salt: string, iv: string, cipher: string}} cipher - the cipher data
   */
  decrypt = async (passwordOrKey, cipher) => {
    await this._initialize();
    return global.ncrypto.decrypt.call(this, passwordOrKey, cipher);
  };

  deriveKey = async (password, salt, exportKey = false) => {
    await this._initialize();
    return global.ncrypto.deriveKey.call(this, password, salt, exportKey);
  };
}

class CryptoWorker {
  constructor() {
    this.isReady = false;
  }
  async _initialize() {
    if (this.isReady) return;
    this.worker = new Worker("crypto.worker.js");
    const buffer = Buffer.allocUnsafe(32);
    crypto.getRandomValues(buffer);
    const message = { seed: buffer.buffer };
    await this._communicate("load", message, [message.seed], false);
    this.isReady = true;
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
   * @param {string|Object} data - the plaintext data
   */
  encrypt = (passwordOrKey, data) => {
    return this._communicate("encrypt", {
      passwordOrKey,
      data,
    });
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{salt: string, iv: string, cipher: string}} cipher - the cipher data
   */
  decrypt = (passwordOrKey, cipher) => {
    return this._communicate("decrypt", { passwordOrKey, cipher });
  };

  deriveKey = (password, salt, exportKey = false) => {
    return this._communicate("deriveKey", { password, salt, exportKey });
  };
}

const NCrypto =
  "Worker" in window || "Worker" in global ? CryptoWorker : Crypto;
export default NCrypto;

function loadScript(url) {
  return new Promise((resolve) => {
    // adding the script tag to the head as suggested before
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;

    // then bind the event to the callback function
    // there are several events for cross browser compatibility
    script.onreadystatechange = resolve;
    script.onload = resolve;

    // fire the loading
    head.appendChild(script);
  });
}
