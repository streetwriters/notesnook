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
