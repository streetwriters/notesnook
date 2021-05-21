import SparkMD5 from "spark-md5";
import ObjectID from "./object-id";

export default function () {
  return new ObjectID().toHexString(); //cryptoRandom(12, "hex");
}

export function makeId(text) {
  return SparkMD5.hash(text);
}
