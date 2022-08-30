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

import { decode, encode } from "base64-arraybuffer";
import { compressSync, decompressSync, strToU8, strFromU8 } from "fflate";

/**
 *
 * @param {string} data
 * @returns {string | null} An object containing compressed data
 */
export const compress = (data) => {
  try {
    return encode(compressSync(strToU8(data)).buffer);
  } catch (e) {
    return null;
  }
};

/**
 *
 * @param {string} compressed
 * @returns {string} decompressed string
 */
export const decompress = (compressed) => {
  return strFromU8(decompressSync(new Uint8Array(decode(compressed))));
};
