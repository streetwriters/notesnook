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

import { describe, expect, test } from "vitest";
import { decode, encode, stringifyJsonOnly } from "./kv-codec";

describe("kv codec", () => {
  test("an ArrayBuffer round trips as an ArrayBuffer", () => {
    const source = new Uint8Array([1, 2, 3, 250]).buffer;
    const value = decode<ArrayBuffer>(encode(source));
    expect(value).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(value))).toEqual([1, 2, 3, 250]);
  });

  test("a Uint8Array round trips as a Uint8Array", () => {
    const value = decode<Uint8Array>(encode(new Uint8Array([9, 8, 7])));
    expect(value).toBeInstanceOf(Uint8Array);
    expect(Array.from(value)).toEqual([9, 8, 7]);
  });

  test("other typed arrays keep their type", () => {
    const value = decode<Uint32Array>(encode(new Uint32Array([70000, 5])));
    expect(value).toBeInstanceOf(Uint32Array);
    expect(Array.from(value)).toEqual([70000, 5]);
  });

  test("buffers nested in objects and arrays survive", () => {
    const source = {
      credentials: [{ id: "password", salt: new Uint8Array([1, 2]) }],
      wrapped: new Uint8Array([4, 5, 6]).buffer,
      name: "x",
      n: 3
    };
    const value = decode<typeof source>(encode(source));
    expect(value.credentials[0].salt).toBeInstanceOf(Uint8Array);
    expect(value.wrapped).toBeInstanceOf(ArrayBuffer);
    expect(value.name).toBe("x");
    expect(value.n).toBe(3);
  });

  test("plain values are unchanged", () => {
    expect(decode(encode({ a: [1, "b", null, true] }))).toEqual({
      a: [1, "b", null, true]
    });
  });

  describe("every binary shape the key store persists", () => {
    const subtle = globalThis.crypto.subtle;
    const random = (length: number) =>
      globalThis.crypto.getRandomValues(new Uint8Array(length));

    test("the credential list: password salt and security key config", () => {
      const source = [
        {
          type: "password",
          id: "password",
          salt: random(16),
          iterations: 600000,
          active: true
        },
        {
          type: "securityKey",
          id: "securityKey",
          active: false,
          config: {
            firstSalt: random(32),
            label: "Security key",
            rawId: random(16).buffer,
            transports: ["usb"]
          }
        }
      ];
      const value = decode<typeof source>(encode(source));
      const password = value[0] as (typeof source)[0] & { salt: Uint8Array };
      expect(password.salt).toBeInstanceOf(Uint8Array);
      expect(Array.from(password.salt)).toEqual(
        Array.from(source[0].salt as Uint8Array)
      );
      expect((password as { iterations: number }).iterations).toBe(600000);
      const key = value[1] as {
        config: {
          firstSalt: Uint8Array;
          rawId: ArrayBuffer;
          transports: string[];
          label: string;
        };
      };
      expect(key.config.firstSalt).toBeInstanceOf(Uint8Array);
      expect(key.config.rawId).toBeInstanceOf(ArrayBuffer);
      expect(Array.from(key.config.firstSalt)).toEqual(
        Array.from(
          (source[1] as { config: { firstSalt: Uint8Array } }).config.firstSalt
        )
      );
      expect(key.config.transports).toEqual(["usb"]);
      expect(key.config.label).toBe("Security key");
    });

    test("an AES-KW wrapped database key unwraps after a round trip", async () => {
      const wrapping = await subtle.generateKey(
        { name: "AES-KW", length: 256 },
        true,
        ["wrapKey", "unwrapKey"]
      );
      const secret = await subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const wrapped = await subtle.wrapKey("raw", secret, wrapping, "AES-KW");
      const stored = decode<ArrayBuffer>(encode(wrapped));
      expect(stored).toBeInstanceOf(ArrayBuffer);
      const unwrapped = await subtle.unwrapKey(
        "raw",
        stored,
        wrapping,
        "AES-KW",
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      expect(
        Array.from(new Uint8Array(await subtle.exportKey("raw", unwrapped)))
      ).toEqual(
        Array.from(new Uint8Array(await subtle.exportKey("raw", secret)))
      );
    });

    test("an encrypted secret {iv, cipher} decrypts after a round trip", async () => {
      const key = await subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      const iv = random(12);
      const plain = new TextEncoder().encode(JSON.stringify({ value: 15 }));
      const cipher = await subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
      const stored = decode<{ iv: Uint8Array; cipher: ArrayBuffer }>(
        encode({ iv, cipher })
      );
      expect(stored.iv).toBeInstanceOf(Uint8Array);
      expect(stored.cipher).toBeInstanceOf(ArrayBuffer);
      const decrypted = await subtle.decrypt(
        { name: "AES-GCM", iv: stored.iv as Uint8Array<ArrayBuffer> },
        key,
        stored.cipher
      );
      expect(new TextDecoder().decode(decrypted)).toBe(
        JSON.stringify({ value: 15 })
      );
    });

    test("the safeStorage wrapped master key stays a Uint8Array", () => {
      const ciphertext = new TextEncoder().encode(
        JSON.stringify({ iv: "aa", cipher: "bb", salt: "cc" })
      );
      const stored = decode<Uint8Array>(encode(ciphertext));
      expect(stored).toBeInstanceOf(Uint8Array);
      expect(new TextDecoder().decode(stored)).toBe(
        new TextDecoder().decode(ciphertext)
      );
    });

    test("an empty ArrayBuffer default secret survives", () => {
      const stored = decode<ArrayBuffer>(encode(new ArrayBuffer(0)));
      expect(stored).toBeInstanceOf(ArrayBuffer);
      expect(stored.byteLength).toBe(0);
    });

    test("a value written by the old encoder (an ArrayBuffer stored as {}) is not silently accepted as bytes", () => {
      const legacy = decode<unknown>(JSON.stringify({}));
      expect(legacy).not.toBeInstanceOf(ArrayBuffer);
      expect(legacy).not.toBeInstanceOf(Uint8Array);
    });
  });

  describe("Config values", () => {
    test("json values stringify unchanged", () => {
      expect(
        JSON.parse(stringifyJsonOnly({ a: [1, "b", null, true], n: 2.5 }))
      ).toEqual({ a: [1, "b", null, true], n: 2.5 });
    });

    test("binary values are rejected instead of being silently corrupted", () => {
      expect(() => stringifyJsonOnly(new Uint8Array([1]))).toThrow(/binary/);
      expect(() => stringifyJsonOnly({ k: new ArrayBuffer(2) })).toThrow(
        /binary/
      );
    });
  });
});
