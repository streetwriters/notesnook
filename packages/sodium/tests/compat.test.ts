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

import { Sodium as BrowserSodium } from "../src/browser.ts";
import { Sodium as NodeSodium } from "../src/node.ts";
import { base64_variants } from "../src/types.ts";
import { test } from "vitest";
import {
  decrypt,
  encrypt,
  getKey,
  hash,
  streamingDecrypt,
  streamingEncrypt
} from "./utils.ts";

const browser = new BrowserSodium();
const node = new NodeSodium();

test("secretstream tags should be equal on node & browser variants", async (t) => {
  t.expect(browser.crypto_secretstream_xchacha20poly1305_TAG_FINAL).toBe(
    node.crypto_secretstream_xchacha20poly1305_TAG_FINAL
  );
  t.expect(browser.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE).toBe(
    node.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
  );
});

test("pwhash should be equal on node & browser variants", async (t) => {
  t.expect(await hash(browser)).toBe(await hash(node));
});

test("encrypted result should be equal on node & browser variants", async (t) => {
  const nonce = node.randombytes_buf(
    node.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const { key } = await getKey(browser);
  t.expect(await encrypt(browser, nonce, key)).toBe(
    await encrypt(node, nonce, key)
  );
});

test("decrypted result should be equal on node & browser variants", async (t) => {
  const nonce = node.randombytes_buf(
    node.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const { key } = await getKey(browser);
  t.expect(
    await decrypt(
      browser,
      browser.from_base64(await encrypt(node, nonce, key)),
      nonce,
      key
    )
  ).toBe("mystring");
  t.expect(
    await decrypt(
      browser,
      node.from_base64(await encrypt(browser, nonce, key)),
      nonce,
      key
    )
  ).toBe("mystring");
});

test("streaming encryption result should be decryptable on node & browser variants", async (t) => {
  const { key } = await getKey(browser);
  const browserResult = await streamingEncrypt(browser, key);
  const nodeResult = await streamingEncrypt(node, key);

  t.expect(await streamingDecrypt(browser, key, nodeResult)).toMatchObject([
    { message: "chunk1", tag: 0 },
    { message: "chunk2", tag: 0 },
    { message: "chunk3", tag: 3 }
  ]);
  t.expect(await streamingDecrypt(node, key, browserResult)).toMatchObject([
    { message: "chunk1", tag: 0 },
    { message: "chunk2", tag: 0 },
    { message: "chunk3", tag: 3 }
  ]);
});

test("node & browser variants of base64 should be compatible", async (t) => {
  const text = new Uint8Array([
    223, 137, 144, 213, 112, 69, 249, 172, 9, 36, 33, 206, 180, 149, 244, 178,
    220, 223, 248, 200, 114, 14, 213, 200, 202
  ]);

  t.expect(browser.to_base64(text)).toBe(node.to_base64(text));

  t.expect(browser.to_base64(text, base64_variants.ORIGINAL)).toBe(
    node.to_base64(text, base64_variants.ORIGINAL)
  );

  t.expect(browser.to_base64(text, base64_variants.ORIGINAL_NO_PADDING)).toBe(
    node.to_base64(text, base64_variants.ORIGINAL_NO_PADDING)
  );

  t.expect(browser.to_base64(text, base64_variants.URLSAFE_NO_PADDING)).toBe(
    node.to_base64(text, base64_variants.URLSAFE_NO_PADDING)
  );

  t.expect(browser.to_base64(text, base64_variants.URLSAFE)).toBe(
    node.to_base64(text, base64_variants.URLSAFE)
  );
});
