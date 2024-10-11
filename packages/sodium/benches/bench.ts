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

import { Sodium as BrowserSodium } from "../src/browser";
import { Sodium as NodeSodium } from "../src/node";
import benny from "benny";
import {
  decrypt,
  encrypt,
  getKey,
  hash,
  streamingEncrypt
} from "../tests/utils";

const browser = new BrowserSodium();
const node = new NodeSodium();

async function main() {
  await browser.initialize();
  const nonce = node.randombytes_buf(
    node.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
  );
  const { key } = await getKey(browser);
  const ciphertext = node.from_base64(await encrypt(node, nonce, key));

  await benny.suite(
    "Encryption",
    benny.add("browser", async () => {
      await encrypt(browser, nonce, key);
    }),
    benny.add("node", async () => {
      await encrypt(node, nonce, key);
    }),
    benny.cycle(),
    benny.complete()
  );

  await benny.suite(
    "Key generation",
    benny.add("browser", async () => {
      await getKey(browser);
    }),
    benny.add("node", async () => {
      await getKey(node);
    }),
    benny.cycle(),
    benny.complete()
  );

  await benny.suite(
    "Hashing",
    benny.add("browser", async () => {
      await hash(browser);
    }),
    benny.add("node", async () => {
      await hash(node);
    }),
    benny.cycle(),
    benny.complete()
  );

  await benny.suite(
    "Decryption",
    benny.add("browser", async () => {
      await decrypt(browser, ciphertext, nonce, key);
    }),
    benny.add("node", async () => {
      await decrypt(node, ciphertext, nonce, key);
    }),
    benny.cycle(),
    benny.complete()
  );

  await benny.suite(
    "Streaming encrypt",
    benny.add("browser", async () => {
      await streamingEncrypt(browser, key);
    }),
    benny.add("node", async () => {
      await streamingEncrypt(node, key);
    }),
    benny.cycle(),
    benny.complete()
  );
}
main();
