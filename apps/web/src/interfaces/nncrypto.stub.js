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

var instance = null;

/**
 *
 * @returns {Promise<import("nncrypto/src/interfaces").INNCrypto>}
 */
export function getNNCrypto() {
  if (instance) return instance;
  return queueify(async () => {
    const NNCrypto = await loadNNCrypto();
    instance = new NNCrypto(WORKER_PATH);
    return instance;
  });
}

var processing = false;
var queue = [];
async function queueify(action) {
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
