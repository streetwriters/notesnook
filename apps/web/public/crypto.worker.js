/* eslint-disable */

var context;
if (!self instanceof Window) {
  self.sodium = {
    onload: function (_sodium) {
      context = { sodium: _sodium };
      sendMessage("loaded");
    },
  };
  importScripts("sodium.js");

  self.addEventListener("message", onMessage);
}

function onMessage(ev) {
  const { type, data, messageId } = ev.data;
  if (type === "encrypt") {
    const { passwordOrKey, data: _data } = data;
    const cipher = encrypt.call(context, passwordOrKey, _data);
    sendMessage("encrypt", cipher, messageId);
  } else if (type === "decrypt") {
    const { passwordOrKey, cipher } = data;
    const plainText = decrypt.call(context, passwordOrKey, cipher);
    sendMessage("decrypt", plainText, messageId);
  } else if (type === "deriveKey") {
    const { password, salt, exportKey } = data;
    const derivedKey = deriveKey.call(context, password, salt, exportKey);
    sendMessage("deriveKey", derivedKey, messageId);
  }
}

function sendMessage(type, data, messageId) {
  postMessage({ type, data, messageId });
}

const deriveKey = (password, salt, exportKey = false) => {
  const { sodium } = this;

  if (!salt) salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  else {
    salt = sodium.from_base64(salt);
  }

  const key = sodium.crypto_pwhash(
    sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    password,
    salt,
    3, // operations limit
    1024 * 1024 * 8, // memory limit (8MB)
    sodium.crypto_pwhash_ALG_ARGON2I13,
    exportKey ? "base64" : "uint8array"
  );
  const saltHex = sodium.to_base64(salt);
  sodium.memzero(salt);
  if (exportKey) {
    return key;
  }
  return { key, salt: saltHex };
};

const _getKey = (passwordOrKey) => {
  const { sodium } = this;

  let { salt, key, password } = passwordOrKey;
  if (password) {
    const result = deriveKey(password, salt);
    key = result.key;
    salt = result.salt;
  } else if (key && salt) {
    salt = passwordOrKey.salt;
    key = sodium.from_base64(key);
  }
  return { key, salt };
};

/**
 *
 * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
 * @param {string|Object} data - the plaintext data
 */
const encrypt = (passwordOrKey, data) => {
  const { sodium } = this;

  const { key, salt } = _getKey(passwordOrKey);

  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    data,
    undefined,
    undefined,
    nonce,
    key,
    "base64"
  );
  const iv = sodium.to_base64(nonce);
  sodium.memzero(nonce);
  sodium.memzero(key);
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
const decrypt = (passwordOrKey, { iv, cipher, salt }) => {
  const { sodium } = this;

  const { key } = _getKey({ salt, ...passwordOrKey });

  const plainText = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    undefined,
    sodium.from_base64(cipher),
    undefined,
    sodium.from_base64(iv),
    key,
    "text"
  );
  sodium.memzero(key);
  return plainText;
};

if (self instanceof Window) {
  self.ncrypto = {
    decrypt,
    deriveKey,
    encrypt,
  };
}
