/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
