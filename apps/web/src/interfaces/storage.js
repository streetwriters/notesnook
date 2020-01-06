async function read(key) {
  return new Promise((resolve, reject) =>
    resolve(window.localStorage.getItem(key))
  );
}
async function write(key, data) {
  return new Promise((resolve, reject) =>
    resolve(window.localStorage.setItem(key, data))
  );
}
function remove(key) {
  window.localStorage.removeItem(key);
}
function clear() {
  window.localStorage.clear();
}

function encrypt(password, data) {
  return deriveKey(password).then(key => {
    console.log(key);
    // a public value that should be generated for changes each time
    var initializationVector = new Uint8Array(16);
    crypto.getRandomValues(initializationVector);

    return crypto.subtle
      .encrypt(
        { name: "AES-CBC", iv: initializationVector },
        key,
        toArrayBuffer(new Buffer(data))
      )
      .then(function(encrypted) {
        let b64 = require("../utils/base64");
        return {
          iv: b64.encode(initializationVector),
          cipher: b64.encode(encrypted)
        };
      });
  });
}

function decrypt(password, data) {
  return deriveKey(password).then(key => {
    let b64 = require("../utils/base64");

    return crypto.subtle
      .decrypt(
        { name: "AES-CBC", iv: b64.decode(data.iv) },
        key,
        b64.decode(data.cipher)
      )
      .then(function(decrypted) {
        return new Buffer(b64.encode(decrypted), "base64").toString("utf8");
      });
  });
}

module.exports = {
  read,
  write,
  remove,
  clear,
  encrypt,
  decrypt
};

function deriveKey(passphrase) {
  var keyLenBits = 256;
  var kdfname = "PBKDF2";
  var aesname = "AES-CBC"; // AES-CTR is also popular
  // 100 - probably safe even on a browser running from a raspberry pi using pure js ployfill
  // 10000 - no noticeable speed decrease on my MBP
  // 100000 - you can notice
  // 1000000 - annoyingly long
  var iterations = 5000; // something a browser on a raspberry pi or old phone could do
  var hashname = "SHA-256";
  var extractable = true;

  // First, create a PBKDF2 "key" containing the password
  return (
    crypto.subtle
      .importKey(
        "raw",
        new Buffer(passphrase, "binary"),
        { name: kdfname },
        false,
        ["deriveKey"]
      )
      // Derive a key from the password
      .then(function(passphraseKey) {
        return crypto.subtle.deriveKey(
          {
            name: kdfname,
            salt: toArrayBuffer(new Buffer("salt")),
            iterations: iterations,
            hash: hashname
          },
          passphraseKey,
          // required to be 128 (or 256) bits
          { name: aesname, length: keyLenBits }, // Key we want
          extractable, // Extractble
          ["encrypt", "decrypt"] // For new key
        );
      })
      // Export it so we can display it
      .then(function(aesKey) {
        return aesKey;
      })
      .catch(function(err) {
        window.alert("Key derivation failed: " + err.message);
      })
  );
}

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}
