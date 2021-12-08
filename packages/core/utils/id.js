import { hash, SALT_LENGTH } from "@stablelib/blake2s";
import SparkMD5 from "spark-md5";
import { USER_PERSONALIZATION_HASH } from "../common";
import { randomBytes } from "./random";

export default function () {
  const bytes = randomBytes(64);
  const salt = randomBytes(SALT_LENGTH);
  return Buffer.from(
    hash(bytes, 12, { salt, personalization: USER_PERSONALIZATION_HASH })
  ).toString("hex");
}

export function makeId(text) {
  return SparkMD5.hash(text);
}
