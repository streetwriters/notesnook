// eslint-disable-next-line import/no-webpack-loader-syntax
import "worker-loader?filename=static/workers/nncrypto.worker.js!nncryptoworker/dist/src/worker.js";
import { NNCrypto } from "nncrypto";
import { NNCryptoWorker } from "nncryptoworker";

export default "Worker" in window || "Worker" in global
  ? NNCryptoWorker
  : NNCrypto;
export const WORKER_PATH = "/static/workers/nncrypto.worker.js";
