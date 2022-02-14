import { INNCrypto } from "@notesnook/crypto/dist/src/interfaces";
// eslint-disable-next-line import/no-webpack-loader-syntax
import "worker-loader?filename=static/workers/nncrypto.worker.js!nncryptoworker/dist/src/worker.js";

const WORKER_PATH = "/static/workers/nncrypto.worker.js";

async function loadNNCrypto() {
  const hasWorker = "Worker" in window || "Worker" in global;
  if (hasWorker) {
    const { NNCryptoWorker } = await import("nncryptoworker");
    return NNCryptoWorker;
  } else {
    const { NNCrypto } = await import("@notesnook/crypto");
    return NNCrypto;
  }
}

var instance: INNCrypto | null = null;

export function getNNCrypto(): Promise<INNCrypto> {
  if (instance) return Promise.resolve(instance);
  return queueify<INNCrypto>(async () => {
    const NNCrypto = await loadNNCrypto();
    instance = new NNCrypto(WORKER_PATH);
    return instance;
  });
}

var processing = false;
var queue: Array<any> = [];
async function queueify<T>(action: () => Promise<T>): Promise<T> {
  if (processing)
    return new Promise((resolve) => {
      queue.push(resolve);
    });

  processing = true;
  const result = await action();
  processing = false;

  while (queue.length > 0) {
    const resolve = queue.pop();
    resolve(result);
  }
  return result;
}
