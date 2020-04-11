import _sodium from "libsodium-wrappers";

export async function newSodium() {
  await _sodium.ready;
  return _sodium;
}

class Crypto {
  constructor() {
    this.isReady = false;
    this.sodium = _sodium;
  }

  async init() {
    this.sodium = await newSodium();
    this.isReady = true;
  }

  _throwIfNotReady() {
    if (!this.isReady)
      throw new Error("libsodium is not ready yet. Please call init()");
  }

  _deriveKey(password, keyLength, salt) {
    this._throwIfNotReady();
    salt =
      salt || this.sodium.randombytes_buf(this.sodium.crypto_pwhash_SALTBYTES);
    const key = this.sodium.crypto_pwhash(
      keyLength,
      password,
      salt,
      3, // operations limit
      1024 * 1024 * 4, // memory limit (4MB)
      this.sodium.crypto_pwhash_ALG_ARGON2I13
    );
    const saltHex = this.sodium.to_hex(salt);
    this.sodium.memzero(salt);
    return { key, salt: saltHex };
  }

  encrypt(password, data) {
    if (typeof data === "object") data = JSON.stringify(data);
    this._throwIfNotReady();
    const { key, salt } = this._deriveKey(
      password,
      this.sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES
    );
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
    const iv = this.sodium.to_hex(nonce);
    this.sodium.memzero(nonce);
    this.sodium.memzero(key);
    return {
      cipher,
      iv,
      salt,
    };
  }

  decrypt(password, { salt, iv, cipher }) {
    this._throwIfNotReady();
    const { key } = this._deriveKey(
      password,
      this.sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
      this.sodium.from_hex(salt)
    );
    const plainText = this.sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      undefined,
      this.sodium.from_base64(cipher),
      undefined,
      this.sodium.from_hex(iv),
      key,
      "text"
    );
    this.sodium.memzero(key);
    return plainText;
  }
}
export default Crypto;
