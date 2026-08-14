---
title: How is my data encrypted?
pageTitle: How does Notesnook encrypt my notes?
description: Every note is encrypted on your device with XChaCha20-Poly1305-IETF and a key derived with Argon2, before anything is sent. Here is exactly how it works.
keywords:
  - notesnook encryption
  - end to end encrypted notes app
  - xchacha20 poly1305 notes
  - zero knowledge note taking
schema: faq
faqs:
  - q: How does Notesnook encrypt my notes?
    a: Every item is encrypted on your device with XChaCha20-Poly1305-IETF before it is synced. The key comes from a data encryption key that is itself protected by a master key derived from your password with Argon2. The server only ever receives ciphertext.
  - q: Can Notesnook read my notes?
    a: No. Your password never leaves your device, and the keys that decrypt your notes never leave it either. The server stores encrypted blobs it has no way to open.
  - q: What happens if I forget my password?
    a: Your account recovery key is the only way back to your data. Without your password and without that key, nobody — including Notesnook — can decrypt your notes.
---

# How is my data encrypted?

Everything you write is encrypted on your own device before it is sent anywhere. The Notesnook server stores ciphertext it cannot open, which is why nobody here can read your notes — and why nobody here can recover them for you if you lose both your password and your recovery key.

::: info This is an explanation, not a specification
This page describes how the encryption works in practice. It is not a formal spec.

:::

## Algorithms & cryptographic library

| Purpose                                     | Algorithm               |
| ------------------------------------------- | ----------------------- |
| Encrypting and decrypting your data         | XChaCha20-Poly1305-IETF |
| Deriving your master key from your password | Argon2i                 |
| Hashing your password for the server        | Argon2id                |

All of it comes from [**libsodium**](https://libsodium.org). Web, desktop and mobile use the same library for every cryptographic operation, so a note encrypted on one platform decrypts identically on the others.

## Process

### 1. Sign up & sign in

When you sign up for an account, the app takes your password and hashes it using Argon2 with a `predictable per user salt`.

This predictable salt is generated using a `fixed client salt` + `your email`.

::: info Your password never leaves your device
Only the hash is sent, never the password itself, so there is no way for us — or anyone who intercepts the request — to learn your password.

:::

After the hash is generated, it is sent to the server. This hash is used as a `password` and is hashed again to mitigate password passthrough attacks.

This process is repeated every time you sign in.

### 2. Key generation

When you first sign up for an account, your client generates two encryption keys. One is a unique data encryption key that encrypts all your notes and other data. The second is your master encryption key, derived from your password and that predictable salt. This key protects all your encryption keys, like the aforementioned data encryption key. If you change your password, your client will re-encrypt your existing data encryption key with your new master key.

### 3. Encryption key storage

:::tabs key:platform
== Desktop/Web
Instead of storing the key as plain text (and allowing anyone to copy/move it), we use browser's `IndexedDB` to store the key as a `CryptoKey`.

`CryptoKey` is stored securely by the browser and cannot be exported, viewed, or copied except by the app & browser.

== Mobile

On iOS and Android, the encryption key is stored in the phone's keychain.

:::

### 4. Data encryption

Encryption takes place when you sync. Each item in the database is encrypted separately using XChaCha20-Poly1305-IETF.

#### How it works

1. The item is read from the database as JSON object and stringified (i.e. converted to a string).
2. The string is encrypted using the data encryption key generated earlier.
3. The result is a JSON object which contains:
   1. A base64 encoded `cipher`
   2. A 192-bit nonce (`iv`)
   3. A random `salt`
   4. Algorithm id `alg`
   5. ItemId `id`

::: info
See the whole process in action [here.](https://vericrypt.notesnook.com/)

:::

This object is then sent to the server for storage. The server performs no further operation on this data (because it can't).

## FAQs

### Can Notesnook read my notes?

No. Your notes are encrypted on your device with keys that never leave it, and the server only ever receives ciphertext. This is also why we cannot reset your password or recover your notes for you — see [recovering your account](/recovering-your-account).

### What happens if I forget my password?

Your [account recovery key](/recovering-your-account) is the only way back into your data. Without your password and without that key, your notes cannot be decrypted by anyone.

### I am an old user of Notesnook and I don't have a data encryption key

Your data encryption key is created the next time you change your password.

## Related pages

- [Private vault](/lock-notes-with-private-vault) — locking individual notes
- [Recovering your account](/recovering-your-account) — when you forget your password
- [Backup and restore](/backup-and-restore-notes-in-notesnook) — keeping your own encrypted copy
- [Two-factor authentication](/two-factor-authentication) — a second step at login
