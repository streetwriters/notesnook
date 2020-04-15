class Crypto {
  isReady = false;
  constructor() {
    this.sodium = undefined;
  }
  async _initialize() {
    if (this.isReady) return;
    const _sodium = require("libsodium-wrappers");
    await _sodium.ready;
    this.sodium = _sodium;
    this.isReady = true;
  }

  deriveKey = async (password, salt, exportKey = false) => {
    await this._initialize();

    if (!salt)
      salt = this.sodium.randombytes_buf(this.sodium.crypto_pwhash_SALTBYTES);
    else {
      salt = this.sodium.from_base64(salt);
    }

    const key = this.sodium.crypto_pwhash(
      this.sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
      password,
      salt,
      3, // operations limit
      1024 * 1024 * 8, // memory limit (8MB)
      this.sodium.crypto_pwhash_ALG_ARGON2I13,
      exportKey ? "base64" : "uint8array"
    );
    const saltHex = this.sodium.to_base64(salt);
    this.sodium.memzero(salt);
    if (exportKey) {
      return key;
    }
    return { key, salt: saltHex };
  };

  _getKey = async (passwordOrKey) => {
    let { salt, key, password } = passwordOrKey;
    if (password) {
      const result = await this.deriveKey(password, salt);
      key = result.key;
      salt = result.salt;
    } else if (key && salt) {
      salt = passwordOrKey.salt;
      key = this.sodium.from_base64(key);
    }
    return { key, salt };
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {string|Object} data - the plaintext data
   */
  encrypt = async (passwordOrKey, data) => {
    await this._initialize();

    const { key, salt } = await this._getKey(passwordOrKey);

    const nonce = this.sodium.randombytes_buf(
      this.sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
    );
    const cipher = this.sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      data,
      undefined,
      undefined,
      nonce,
      key,
      "base64"
    );
    const iv = this.sodium.to_base64(nonce);
    this.sodium.memzero(nonce);
    this.sodium.memzero(key);
    return {
      cipher,
      iv,
      salt,
      length: data.length,
    };
  };

  /**
   *
   * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
   * @param {{salt: string, iv: string, cipher: string}} cipher - the cipher data
   */
  decrypt = async (passwordOrKey, { iv, cipher, salt }) => {
    await this._initialize();
    const { key } = await this._getKey({ salt, ...passwordOrKey });

    const plainText = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      undefined,
      this.sodium.from_base64(cipher),
      undefined,
      this.sodium.from_base64(iv),
      key,
      "text"
    );
    this.sodium.memzero(key);
    return plainText;
  };
}
export default Crypto;
