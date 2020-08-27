import cryptoRandom from "crypto-random-string";

export default function () {
  return cryptoRandom({ length: 24, type: "hex" }).toLowerCase();
}
