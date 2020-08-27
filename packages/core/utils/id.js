import cryptoRandom from "crypto-random-string";

export default function () {
  return cryptoRandom({ length: 16, type: "hex" }).toLowerCase();
}
