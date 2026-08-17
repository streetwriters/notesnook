/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { test, expect, describe } from "vitest";
import { NNCrypto } from "../src/index.js";
import { randomBytes } from "crypto";

const crypto = new NNCrypto();

function validSalt() {
  return randomBytes(16).toString("base64");
}

// ─── Key Derivation ────────────────────────────────────────────────

describe("KeyUtils.deriveKey", () => {
  test("same password + salt produces same key", async () => {
    const salt = validSalt();
    const key1 = await crypto.deriveKey("password123", salt);
    const key2 = await crypto.deriveKey("password123", salt);
    expect(key1.key).toEqual(key2.key);
    expect(key1.salt).toBe(key2.salt);
  });

  test("different passwords produce different keys", async () => {
    const salt = validSalt();
    const key1 = await crypto.deriveKey("password1", salt);
    const key2 = await crypto.deriveKey("password2", salt);
    expect(key1.key).not.toEqual(key2.key);
  });

  test("different salts produce different keys", async () => {
    const salt1 = validSalt();
    const salt2 = validSalt();
    const key1 = await crypto.deriveKey("password", salt1);
    const key2 = await crypto.deriveKey("password", salt2);
    expect(key1.key).not.toEqual(key2.key);
  });

  test("without salt generates a random salt", async () => {
    const key1 = await crypto.deriveKey("password");
    const key2 = await crypto.deriveKey("password");
    expect(key1.salt).not.toBe(key2.salt);
    expect(key1.key).not.toEqual(key2.key);
  });

  test("exportKey returns SerializedKey with base64 key and salt", async () => {
    const salt = validSalt();
    const exported = await crypto.exportKey("password", salt);
    expect(exported.key).toBeDefined();
    expect(exported.salt).toBe(salt);
    expect(typeof exported.key).toBe("string");
    expect(exported.key!.length).toBeGreaterThan(0);
  });

  test("exportKey without salt generates one", async () => {
    const exported = await crypto.exportKey("password");
    expect(exported.key).toBeDefined();
    expect(exported.salt).toBeDefined();
    expect(typeof exported.salt).toBe("string");
  });

  test("deriveKey produces 32-byte key", async () => {
    const salt = validSalt();
    const key = await crypto.deriveKey("password", salt);
    // libsodium crypto_aead_xchacha20poly1305_ietf_KEYBYTES = 32
    expect(key.key.length).toBe(32);
  });
});

// ─── Symmetric Encryption Round-Trip ───────────────────────────────

describe("Encryption/Decryption round-trip", () => {
  test("text encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const plaintext = "Hello, Notesnook!";
    const cipher = await crypto.encrypt(key, plaintext, "text", "base64");

    expect(cipher.cipher).toBeDefined();
    expect(cipher.iv).toBeDefined();
    expect(cipher.salt).toBeDefined();
    expect(cipher.format).toBe("base64");
    expect(cipher.alg).toContain("xcha");
    expect(cipher.length).toBe(plaintext.length);

    const decrypted = await crypto.decrypt(key, cipher, "text");
    expect(decrypted).toBe(plaintext);
  });

  test("base64 input encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const plaintext = "SGVsbG8gV29ybGQ=";
    const cipher = await crypto.encrypt(key, plaintext, "base64", "base64");
    const decrypted = await crypto.decrypt(key, cipher, "base64");
    expect(decrypted).toBe(plaintext);
  });

  test("empty string encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const plaintext = "";
    const cipher = await crypto.encrypt(key, plaintext, "text", "base64");
    const decrypted = await crypto.decrypt(key, cipher, "text");
    expect(decrypted).toBe(plaintext);
  });

  test("unicode string encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const plaintext = "Hello \u{1F30D}! Testing \u{00E9}mojis and \u{65E5}\u{672C}\u{8A9E}";
    const cipher = await crypto.encrypt(key, plaintext, "text", "base64");
    const decrypted = await crypto.decrypt(key, cipher, "text");
    expect(decrypted).toBe(plaintext);
  });

  test("long text encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const plaintext = "A".repeat(100000);
    const cipher = await crypto.encrypt(key, plaintext, "text", "base64");
    const decrypted = await crypto.decrypt(key, cipher, "text");
    expect(decrypted).toBe(plaintext);
  });

  test("decrypt with wrong key throws", async () => {
    const salt = validSalt();
    const key1 = await crypto.exportKey("password1", salt);
    const key2 = await crypto.exportKey("password2", salt);
    const cipher = await crypto.encrypt(key1, "secret", "text", "base64");

    await expect(crypto.decrypt(key2, cipher, "text")).rejects.toThrow();
  });

  test("each encryption produces unique ciphertext (random nonce)", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const cipher1 = await crypto.encrypt(key, "same data", "text", "base64");
    const cipher2 = await crypto.encrypt(key, "same data", "text", "base64");
    expect(cipher1.cipher).not.toBe(cipher2.cipher);
    expect(cipher1.iv).not.toBe(cipher2.iv);
  });

  test("cipher with salt in key but no salt on key uses cipher salt", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const cipher = await crypto.encrypt(key, "data", "text", "base64");

    // key without salt - should use cipher's salt
    const keyWithoutSalt = { key: key.key };
    const decrypted = await crypto.decrypt(keyWithoutSalt, cipher, "text");
    expect(decrypted).toBe("data");
  });
});

// ─── Multi-Encryption ──────────────────────────────────────────────

describe("encryptMulti / decryptMulti round-trip", () => {
  test("multiple items encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const items = ["item1", "item2", "item3", "hello world"];
    const ciphers = await crypto.encryptMulti(key, items, "text", "base64");

    expect(ciphers.length).toBe(items.length);

    const decrypted = await crypto.decryptMulti(key, ciphers, "text");
    expect(decrypted).toEqual(items);
  });

  test("empty array encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());
    const ciphers = await crypto.encryptMulti(key, [], "text", "base64");
    expect(ciphers.length).toBe(0);

    const decrypted = await crypto.decryptMulti(key, ciphers, "text");
    expect(decrypted.length).toBe(0);
  });
});

// ─── Password Hashing ──────────────────────────────────────────────

describe("Password.hash", () => {
  test("same password + salt produces same hash", async () => {
    const hash1 = await crypto.hash("mypassword", "salt@email.com");
    const hash2 = await crypto.hash("mypassword", "salt@email.com");
    expect(hash1).toBe(hash2);
  });

  test("different passwords produce different hashes", async () => {
    const hash1 = await crypto.hash("password1", "salt@email.com");
    const hash2 = await crypto.hash("password2", "salt@email.com");
    expect(hash1).not.toBe(hash2);
  });

  test("different salts produce different hashes", async () => {
    const hash1 = await crypto.hash("password", "email1@example.com");
    const hash2 = await crypto.hash("password", "email2@example.com");
    expect(hash1).not.toBe(hash2);
  });

  test("hash is a non-empty string", async () => {
    const hash = await crypto.hash("password", "email@example.com");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });

  test("empty password produces a hash", async () => {
    const hash = await crypto.hash("", "email@example.com");
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(0);
  });
});

// ─── Streaming Encryption ──────────────────────────────────────────

describe("Streaming Encryption/Decryption", () => {
  test("stream encrypt + decrypt round-trip", async () => {
    const key = await crypto.exportKey("testpassword", validSalt());

    const { iv, stream: encryptStream } =
      await crypto.createEncryptionStream(key);

    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    const writer = encryptStream.writable.getWriter();
    const reader = encryptStream.readable.getReader();

    writer.write({ data: encoder.encode("chunk1-"), final: false });
    writer.write({ data: encoder.encode("chunk2-"), final: false });
    writer.write({ data: encoder.encode("chunk3-final"), final: true });

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const decryptStream = await crypto.createDecryptionStream(key, iv);
    const decryptWriter = decryptStream.writable.getWriter();
    const decryptReader = decryptStream.readable.getReader();

    for (const chunk of chunks) {
      decryptWriter.write(chunk);
    }

    const decryptedChunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await decryptReader.read();
      if (done) break;
      decryptedChunks.push(value);
    }

    const decrypted = new Uint8Array(
      decryptedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of decryptedChunks) {
      decrypted.set(chunk, offset);
      offset += chunk.length;
    }

    const decoder = new TextDecoder();
    expect(decoder.decode(decrypted)).toBe("chunk1-chunk2-chunk3-final");
  });
});
