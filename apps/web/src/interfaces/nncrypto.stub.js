import { NNCrypto } from "nncrypto";
import { NNCryptoWorker } from "nncryptoworker";

export default "Worker" in window || "Worker" in global
  ? NNCryptoWorker
  : NNCrypto;
