/* eslint-disable */

var context;
const enc = new TextEncoder();
if (!self.document) {
  self.addEventListener("message", onMessage);
}

function onMessage(ev) {
  const { type, data, messageId } = ev.data;
  try {
    switch (type) {
      case "encrypt": {
        const { passwordOrKey, data: _data } = data;
        const cipher = encrypt.call(context, passwordOrKey, _data, "base64");
        sendMessage("encrypt", cipher, messageId);
        break;
      }
      case "encryptBinary": {
        const { passwordOrKey, data: _data } = data;
        const cipher = encrypt.call(
          context,
          passwordOrKey,
          _data,
          "uint8array"
        );
        sendMessage("encryptBinary", cipher, messageId, [cipher.cipher.buffer]);
        break;
      }
      case "decrypt": {
        const { passwordOrKey, cipher } = data;
        const plainText = decrypt.call(context, passwordOrKey, cipher);
        sendMessage("decrypt", plainText, messageId);
        break;
      }
      case "deriveKey": {
        const { password, salt, exportKey } = data;
        const derivedKey = deriveKey.call(context, password, salt, exportKey);
        sendMessage("deriveKey", derivedKey, messageId);
        break;
      }
      case "hashPassword": {
        const { password, userId } = data;
        const hashedPassword = hashPassword.call(context, password, userId);
        sendMessage("hashPassword", hashedPassword, messageId);
        break;
      }
      case "load": {
        const { seed } = data;
        self.sodium = {
          onload: function (_sodium) {
            context = { sodium: _sodium };
            // create the crypto polyfill if necessary
            webCryptoPolyfill(seed, _sodium);
            sendMessage("load", {}, messageId);
          },
        };
        importScripts("sodium.js");
        break;
      }
      default:
        return;
    }
  } catch (error) {
    console.error("Crypto worker error:", error, messageId, type);
    sendMessage(type, { error: error.message }, messageId);
  }
}

function sendMessage(type, data, messageId, transferables) {
  postMessage({ type, data, messageId }, undefined, transferables);
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

const hashPassword = (password, userId) => {
  const { sodium } = this;

  const appSalt = "oVzKtazBo7d8sb7TBvY9jw";
  const salt = sodium.crypto_generichash(
    sodium.crypto_pwhash_SALTBYTES,
    `${appSalt}${userId}`
  );
  const hash = sodium.crypto_pwhash(
    32,
    password,
    salt,
    3, // operations limit
    1024 * 1024 * 64, // memory limit (8MB)
    sodium.crypto_pwhash_ALG_ARGON2ID13,
    "base64"
  );
  return hash;
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
 * @param {{type: "plain" | "uint8array", data: string | Uint8Array}} plainData - the plaintext data
 */
const encrypt = (passwordOrKey, plainData, outputType) => {
  const { sodium } = this;

  if (plainData.type === "plain") {
    plainData.data = enc.encode(plainData.data);
  } else if (plainData.type === "base64") {
    plainData.data = sodium.from_base64(
      plainData.data,
      sodium.base64_variants.ORIGINAL
    );
  }

  const { key, salt } = _getKey(passwordOrKey);

  const nonce = sodium.randombytes_buf(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );

  const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    plainData.data,
    undefined,
    undefined,
    nonce,
    key,
    outputType
  );
  const iv = sodium.to_base64(nonce);
  sodium.memzero(nonce);
  sodium.memzero(key);
  return {
    alg: getAlgorithm(
      sodium.base64_variants.URLSAFE_NO_PADDING,
      plainData.compress ? 1 : 0 // TODO: Crude but works (change this to a more exact boolean flag)
    ),
    cipher,
    iv,
    salt,
    length: plainData.data.length,
  };
};

/**
 *
 * @param {{password: string}|{key:string, salt: string}} passwordOrKey - password or derived key
 * @param {{salt: string, iv: string, cipher: string}} cipher - the cipher data
 */
const decrypt = (passwordOrKey, { iv, cipher, salt, output, inputType }) => {
  const { sodium } = this;

  const { key } = _getKey({ salt, ...passwordOrKey });
  const input =
    inputType === "uint8array"
      ? input
      : inputType === "base64"
      ? sodium.from_base64(cipher)
      : sodium.decode(cipher);

  const data = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    undefined,
    input,
    undefined,
    sodium.from_base64(iv),
    key,
    output
  );
  sodium.memzero(key);
  return data;
};

if (self.document) {
  self.ncrypto = {
    decrypt,
    deriveKey,
    encrypt,
  };
}

/**
 * If not available natively, uses a separate CSPRNG to polyfill the Web Crypto API.
 * Used in worker threads in some browsers.
 * @param seed Securely generated 32-byte key.
 */
const webCryptoPolyfill = (seed, sodium) => {
  if ("getRandomValues" in crypto) return;

  const nonce = new Uint32Array(2);
  crypto = {
    getRandomValues: (array) => {
      if (!array) {
        throw new TypeError(
          `Failed to execute 'getRandomValues' on 'Crypto': ${
            array === null
              ? "parameter 1 is not of type 'ArrayBufferView'"
              : "1 argument required, but only 0 present"
          }.`
        );
      }
      /* Handle circular dependency between this polyfill and libsodium */
      const sodiumExists = typeof sodium.crypto_stream_chacha20 === "function";
      if (!sodiumExists) {
        throw new Error("No CSPRNG found.");
      }
      ++nonce[nonce[0] === 4294967295 ? 1 : 0];
      const newBytes = sodium().crypto_stream_chacha20(
        array.byteLength,
        seed,
        new Uint8Array(nonce.buffer, nonce.byteOffset, nonce.byteLength)
      );
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).set(
        newBytes
      );
      sodium().memzero(newBytes);
      return array;
    },
    subtle: {},
  };
  self.crypto = crypto;
};

function getAlgorithm(base64Variant) {
  //Template: encryptionAlgorithm-kdfAlgorithm-base64variant
  return `xcha-argon2i13-${base64Variant}`;
}
