---
title: How is my data encrypted
---

{% warn %}

Note: This document is not a spec, only an explanation of the encryption process.

{% end %}


## Algorithms & cryptographic library

1. XChaCha-Poly1305-IETF (for encryption/decryption)
2. Argon2 (for password hashing & PKDF)
   1. `argon2i` for PKDF
   2. `argon2id` for password hashing
3. [**libsodium**](https://libsodium.org)

On all three platforms we use the same exact library for all cryptographic functions. This ensures data integrity across platforms.

!!!info Fun story
When we first added encryption, we used AES-GCM-256 across platforms but the cross-platform compatbility was abyssmal. That is when I found out about the great libsodium. Written in C, wrappers available for all platforms...what more could I want?
!!!

## Process

### 1. Sign up & sign in

When you sign up for an account, the app takes your password and hashes it using Argon2 with a `predictable per user salt`.

This predictable salt is generated using a `fixed client salt` + `your email`.


{% info Your password never leaves your device %}

Sending the hash over sending your plain text password ensures that there is no way for us (or anyone else) to get your password.

{% end %}

After the hash is generated, it is sent to the server. This hash is used as a `password` and is hashed again to mitigate password passthrough attacks.

This process is repeated every time you sign in.

### 2. Key generation

After you are signed in, the app requests your user data which includes, among other things, your salt.

{% info Salt generation %}

When you create an account, the server generates a cryptographically secure random salt for you. This salt is used for key generation.

{% end %}

You password & salt is then used to derive a strong irreversible key using Argon2 as the password key derivation function (PKDF).

### 3. Encryption key storage

# [Desktop/Web](#/tab/web)

Instead of storing the key as plain text (and allowing anyone to copy/move it), we use browser's `IndexedDB` to store the key as a `CryptoKey`.

`CryptoKey` is stored securely by the browser and cannot be exported, viewed, copied except by the app & browser.

# [Mobile](#/tab/mobile)

On iOS and Android, the encryption key is stored in the phone's keychain.

---

### 4. Data encryption

Encryption only takes place when you sync. Each item in the database is encrypted seperately using XChaCha-Poly1305-IETF.

#### How it works

1. The item is read from the database as JSON object and stringified (i.e. converted to a string).
2. The string is encrypted using the encryption key generated earlier.
3. The result is a JSON object which contains:
   1. A base64 encoded `cipher`
   2. A 192-bit nonce (`iv`)
   3. A random `salt`
   4. Algorithm id `alg`
   5. ItemId `id`


{% info %}

See the whole process in action [here.](https://notesnook.com/#whynotesnook)

{% end %}

This object is then sent to the server for storage. The server performs no further operation on this data (because it can't).


