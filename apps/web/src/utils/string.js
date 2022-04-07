export function toTitleCase(str) {
  if (!str || !str[0]) {
    return "";
  }
  return str[0].toUpperCase() + str.substring(1);
}

export function toCamelCase(str) {
  return str.replaceAll(/-(.{1})/gm, (_str, letter) => {
    return letter.toUpperCase();
  });
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

/**
 *
 * @param {string} count
 * @param {string} singular
 * @param {string} plural
 */
export function pluralize(count, singular, plural) {
  return !count || count > 1 ? `${count} ${plural}` : `${count} ${singular}`;
}
