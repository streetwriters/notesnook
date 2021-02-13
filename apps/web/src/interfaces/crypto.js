import lzutf8 from "lzutf8";

/**
 * @return {Uint8Array}
 */
function compress(data) {
  return lzutf8.compress(data, {
    blockSize: 64 * 1024 * 1024,
    outputEncoding: "ByteArray",
    inputEncoding: "String",
  });
}

function decompress(data) {
  return lzutf8.decompress(data, {
    blockSize: 64 * 1024 * 1024,
    inputEncoding: "ByteArray",
    outputEncoding: "String",
  });
}

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
          loadScript("/crypto.worker.js").then(resolve);
        },
      };
      await loadScript("sodium.js");
    });
  }

  /**
   * @private
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} plainData - the plaintext data
   */
  _encryptCompressed = async (passwordOrKey, plainData) => {
    await this._initialize();
    return global.ncrypto.encrypt.call(this, passwordOrKey, {
      type: "uint8array",
      data: compress(plainData),
    });
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} plainData - the plaintext data
   * @param {boolean}
   */
  encrypt = async (passwordOrKey, plainData, compress) => {
    if (compress)
      return await this._encryptCompressed(passwordOrKey, plainData);

    await this._initialize();
    return global.ncrypto.encrypt.call(this, passwordOrKey, {
      type: "plain",
      data: plainData,
    });
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{alg: string, salt: string, iv: string, cipher: string}} cipherData - the cipher data
   */
  decrypt = async (passwordOrKey, cipherData) => {
    const algorithm = parseAlgorithm(cipherData.alg);
    if (algorithm.isCompressed)
      return await this._decryptCompressed(passwordOrKey, cipherData);

    await this._initialize();
    cipherData.output = "text";
    return global.ncrypto.decrypt.call(this, passwordOrKey, cipherData);
  };

  /**
   * @private
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{salt: string, iv: string, cipher: string}} cipherData - the cipher data
   */
  _decryptCompressed = async (passwordOrKey, cipherData) => {
    cipherData.output = "uint8array";
    return decompress(
      await global.ncrypto.decrypt.call(this, passwordOrKey, cipherData)
    );
  };

  deriveKey = async (password, salt, exportKey = false) => {
    await this._initialize();
    return global.ncrypto.deriveKey.call(this, password, salt, exportKey);
  };

  hashPassword = async (password, userId) => {
    await this._initialize();
    return global.ncrypto.hashPassword.call(this, password, userId);
  };
}

class CryptoWorker {
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
   * @private
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} data - the plaintext data
   */
  _encryptCompressed = (passwordOrKey, data) => {
    const message = {
      passwordOrKey,
      data: { type: "uint8array", data: compress(data) },
    };
    return this._communicate("encrypt", message, [message.data.data.buffer]);
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} data - the plaintext data
   * @param {boolean} compress
   */
  encrypt = (passwordOrKey, data, compress) => {
    if (compress) {
      return this._encryptCompressed(passwordOrKey, data);
    }
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
    const algorithm = parseAlgorithm(cipherData.alg);
    if (algorithm.isCompressed)
      return this._decryptCompressed(passwordOrKey, cipherData);

    cipherData.output = "text";
    return this._communicate("decrypt", { passwordOrKey, cipher: cipherData });
  };

  /**
   * @private
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{alg: string, salt: string, iv: string, cipher: string}} cipherData - the cipher data
   */
  _decryptCompressed = async (passwordOrKey, cipherData) => {
    cipherData.output = "uint8array";
    return decompress(
      await this._communicate("decrypt", {
        passwordOrKey,
        cipher: cipherData,
      })
    );
  };

  deriveKey = (password, salt, exportKey = false) => {
    return this._communicate("deriveKey", { password, salt, exportKey });
  };

  hashPassword = (password, userId) => {
    return this._communicate("hashPassword", { password, userId });
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

/**
 *
 * @param {string} alg
 */
function parseAlgorithm(alg) {
  if (!alg) return {};
  const [enc, kdf, compressed, base64variant] = alg.split("-");
  return {
    encryptionAlgorithm: enc,
    kdfAlgorithm: kdf,
    isCompressed: compressed === "1",
    base64_variant: base64variant,
  };
}
