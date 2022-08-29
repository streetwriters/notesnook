import SparkMD5 from "spark-md5";
import ObjectID from "./object-id";

export default function () {
  return new ObjectID().toHexString();
}

export function makeId(text) {
  return SparkMD5.hash(text);
}

/**
 *
 * @param {string} noteId id of a note
 * @returns {string} An id with postfix of "_index"
 */
export function makeSessionContentId(sessionId) {
  return sessionId + "_content";
}
