const WORKER_PATH = "/static/workers/nncrypto.worker.js";

async function loadNNCrypto() {
  const hasWorker = "Worker" in window || "Worker" in global;
  if (hasWorker) {
    // eslint-disable-next-line import/no-webpack-loader-syntax
    await import(
      "worker-loader?filename=static/workers/nncrypto.worker.js!nncryptoworker/dist/src/worker.js"
    );

    const { NNCryptoWorker } = await import("nncryptoworker");
    return NNCryptoWorker;
  } else {
    const { NNCrypto } = await import("nncrypto");
    return NNCrypto;
  }
}

var instance = null;
/**
 *
 * @returns {Promise<import("nncrypto/src/interfaces").INNCrypto>}
 */
export async function getNNCrypto() {
  if (instance) return instance;
  const NNCrypto = await loadNNCrypto();
  return (instance = new NNCrypto(WORKER_PATH));
}
