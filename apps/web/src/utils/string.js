import { captureMessage } from "@sentry/react";

export function toTitleCase(str) {
  if (!str) {
    captureMessage("str is empty in toTitleCase");
    return "";
  }
  return str[0].toUpperCase() + str.substring(1);
}

/**
 *
 * @param {String} str
 */
export function countWords(str) {
  str = str.trim();
  if (!str.length) return 0;
  return str.split(/\W+\S/).length;
}
