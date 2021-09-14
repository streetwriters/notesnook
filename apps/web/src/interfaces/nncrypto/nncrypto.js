export default class NNCrypto {
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
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} plainData - the plaintext data
   * @param {boolean}
   */
  encrypt = async (passwordOrKey, plainData, type = "plain") => {
    await this._initialize();
    return global.ncrypto.encrypt.call(this, passwordOrKey, {
      type,
      data: plainData,
    });
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string} plainData - the plaintext data
   * @param {string} type
   */
  encryptBinary = async (passwordOrKey, plainData, type = "plain") => {
    await this._initialize();
    return global.ncrypto.encryptBinary.call(this, passwordOrKey, {
      type,
      data: plainData,
    });
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{alg: string, salt: string, iv: string, cipher: string}} cipherData - the cipher data
   */
  decrypt = async (passwordOrKey, cipherData) => {
    await this._initialize();
    cipherData.output = "text";
    return global.ncrypto.decrypt.call(this, passwordOrKey, cipherData);
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
