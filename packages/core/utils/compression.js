import { decode, encode } from "base64-arraybuffer";
import fflate from "fflate";


/**
 * 
 * @param {string} data
 * @returns {string | null} An object containing compressed data
 */
export const compress = (data) => {
  try {
    return encode(fflate.compressSync(fflate.strToU8(data)).buffer)
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
  return fflate.strFromU8(
    fflate.decompressSync(new Uint8Array(decode(compressed)))
  );
};
