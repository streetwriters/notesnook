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

import { INNCrypto } from "@notesnook/crypto/dist/src/interfaces";
import CryptoWorker from "@notesnook/crypto-worker/dist/src/worker.js?worker";
import { isDesktop } from "../utils/platform";

async function loadNNCrypto() {
  const hasWorker = "Worker" in window || "Worker" in global;
  if (isDesktop() && window.NativeNNCrypto) {
    return window.NativeNNCrypto;
  } else if (hasWorker) {
    const { NNCryptoWorker } = await import("@notesnook/crypto-worker");
    return NNCryptoWorker;
  } else {
    const { NNCrypto } = await import("@notesnook/crypto");
    return NNCrypto;
  }
}

let instance: INNCrypto | null = null;

export function getNNCrypto(): Promise<INNCrypto> {
  if (instance) return Promise.resolve(instance);
  return queueify<INNCrypto>(async () => {
    const NNCrypto = await loadNNCrypto();
    instance = new NNCrypto(new CryptoWorker());
    return instance;
  });
}

let processing = false;
type PromiseResolve = <T>(value: Awaited<T>) => void;
const queue: Array<PromiseResolve> = [];
async function queueify<T>(action: () => Promise<T>): Promise<T> {
  if (processing)
    return new Promise((resolve) => {
      queue.push(resolve as PromiseResolve);
    });

  processing = true;
  const result = await action();
  processing = false;

  while (queue.length > 0) {
    const resolve = queue.pop();
    if (!resolve) continue;
    resolve(result);
  }
  return result;
}
