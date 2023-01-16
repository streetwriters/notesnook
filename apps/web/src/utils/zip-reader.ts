/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* eslint-disable no-underscore-dangle */
/**
 * Conflux
 * Read (and build) zip files with whatwg streams in the browser.
 *
 * @author Transcend Inc. <https://transcend.io>
 * @license MIT
 */

import { Inflate } from "fflate";

const ERR_BAD_FORMAT = "File format is not recognized.";
const ZIP_COMMENT_MAX = 65536;
const EOCDR_MIN = 22;
const EOCDR_MAX = EOCDR_MIN + ZIP_COMMENT_MAX;
const MAX_VALUE_32BITS = 0xffffffff;

const decoder = new TextDecoder();
const uint16e = (b: Uint8Array, n: number) => b[n] | (b[n + 1] << 8);

export class Entry {
  private dataView: DataView;
  private _fileLike: File;
  private _extraFields: Record<string, DataView>;
  constructor(dataView: DataView, fileLike: File) {
    if (dataView.getUint32(0) !== 0x504b0102) {
      throw new Error("ERR_BAD_FORMAT");
    }

    const dv = dataView;

    this.dataView = dv;
    this._fileLike = fileLike;
    this._extraFields = {};

    for (let i = 46 + this.filenameLength; i < dv.byteLength; ) {
      const id = dv.getUint16(i, true);
      const len = dv.getUint16(i + 2, true);
      const start = dv.byteOffset + i + 4;
      this._extraFields[id] = new DataView(dv.buffer.slice(start, start + len));
      i += len + 4;
    }
  }
  get webkitRelativePath(): string {
    return this.name;
  }

  get type(): string {
    return "application/octet-stream";
  }

  get versionMadeBy() {
    return this.dataView.getUint16(4, true);
  }

  get versionNeeded() {
    return this.dataView.getUint16(6, true);
  }

  get bitFlag() {
    return this.dataView.getUint16(8, true);
  }

  get encrypted() {
    return (this.bitFlag & 0x0001) === 0x0001;
  }

  get compressionMethod() {
    return this.dataView.getUint16(10, true);
  }

  get crc32() {
    return this.dataView.getUint32(16, true);
  }

  get compressedSize() {
    return this.dataView.getUint32(20, true);
  }

  get filenameLength() {
    return this.dataView.getUint16(28, true);
  }

  get extraFieldLength() {
    return this.dataView.getUint16(30, true);
  }

  get commentLength() {
    return this.dataView.getUint16(32, true);
  }

  get diskNumberStart() {
    return this.dataView.getUint16(34, true);
  }

  get internalFileAttributes() {
    return this.dataView.getUint16(36, true);
  }

  get externalFileAttributes() {
    return this.dataView.getUint32(38, true);
  }

  get directory() {
    return !!(this.dataView.getUint8(38) & 16);
  }

  get offset() {
    return this.dataView.getUint32(42, true);
  }

  get zip64() {
    return this.dataView.getUint32(24, true) === MAX_VALUE_32BITS;
  }

  get comment() {
    const dv = this.dataView;
    const uint8 = new Uint8Array(
      dv.buffer,
      dv.byteOffset + this.filenameLength + this.extraFieldLength + 46,
      this.commentLength
    );
    return decoder.decode(uint8);
  }

  // File like IDL methods
  get lastModifiedDate() {
    const t = this.dataView.getUint32(12, true);

    return new Date(
      // Date.UTC(
      ((t >> 25) & 0x7f) + 1980, // year
      ((t >> 21) & 0x0f) - 1, // month
      (t >> 16) & 0x1f, // day
      (t >> 11) & 0x1f, // hour
      (t >> 5) & 0x3f, // minute
      (t & 0x1f) << 1
      // ),
    );
  }

  get lastModified() {
    return +this.lastModifiedDate;
  }

  get name() {
    if (!this.bitFlag && this._extraFields && this._extraFields[0x7075]) {
      return decoder.decode(this._extraFields[0x7075].buffer.slice(5));
    }

    const dv = this.dataView;
    const uint8 = new Uint8Array(
      dv.buffer,
      dv.byteOffset + 46,
      this.filenameLength
    );
    return decoder.decode(uint8);
  }

  get size() {
    const size = this.dataView.getUint32(24, true);
    return size === MAX_VALUE_32BITS ? this._extraFields[1].getUint8(0) : size;
  }

  stream() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    const crc = new Crc32();
    let inflator: Inflate | undefined;
    const onEnd = (ctrl: ReadableStreamController<Uint8Array>) =>
      crc.get() === self.crc32
        ? ctrl.close()
        : ctrl.error(new Error("The crc32 checksum don't match"));

    return new ReadableStream<Uint8Array>({
      async start(ctrl) {
        // Need to read local header to get fileName + extraField length
        // Since they are not always the same length as in central dir...
        const ab = await self._fileLike
          .slice(self.offset + 26, self.offset + 30)
          .arrayBuffer();

        const bytes = new Uint8Array(ab);
        const localFileOffset = uint16e(bytes, 0) + uint16e(bytes, 2) + 30;
        const start = self.offset + localFileOffset;
        const end = start + self.compressedSize;
        (this as any).reader = self._fileLike
          .slice(start, end)
          .stream()
          .getReader();

        if (self.compressionMethod) {
          inflator = new Inflate();
          inflator.ondata = (chunk, final) => {
            crc.append(chunk);
            ctrl.enqueue(chunk);
            if (final) onEnd(ctrl);
          };
        }
      },
      async pull(ctrl) {
        const v = await (this as any).reader.read();
        if (inflator && !v.done) {
          inflator.push(v.value);
        } else if (v.done) {
          onEnd(ctrl);
        } else {
          ctrl.enqueue(v.value);
          crc.append(v.value);
        }
      }
    });
  }

  arrayBuffer() {
    return new Response(this.stream()).arrayBuffer().catch((e) => {
      throw new Error(`Failed to read Entry\n${e}`);
    });
  }

  text() {
    return new Response(this.stream()).text().catch((e) => {
      throw new Error(`Failed to read Entry\n${e}`);
    });
  }

  file() {
    return new Response(this.stream())
      .blob()
      .then(
        (blob) =>
          new File([blob], this.name, { lastModified: this.lastModified })
      )
      .catch((e) => {
        throw new Error(`Failed to read Entry\n${e}`);
      });
  }
}

/**
 * Get a BigInt 64 from a DataView
 *
 * @param {DataView} view a dataview
 * @param {number} position the position
 * @param {boolean} littleEndian whether this uses littleEndian encoding
 * @returns BigInt
 */
function getBigInt64(view: DataView, position: number, littleEndian = false) {
  if ("getBigInt64" in DataView.prototype) {
    return view.getBigInt64(position, littleEndian);
  }

  let value = BigInt(0);
  const isNegative =
    (view.getUint8(position + (littleEndian ? 7 : 0)) & 0x80) > 0;
  let carrying = true;

  for (let i = 0; i < 8; i++) {
    let byte = view.getUint8(position + (littleEndian ? i : 7 - i));

    if (isNegative) {
      if (carrying) {
        if (byte !== 0x00) {
          byte = ~(byte - 1) & 0xff;
          carrying = false;
        }
      } else {
        byte = ~byte & 0xff;
      }
    }

    value = value + BigInt(byte) + BigInt(256) ** BigInt(i);
  }

  if (isNegative) {
    value = -value;
  }

  return value;
}

export async function Reader(file: File) {
  // Seek EOCDR - "End of central directory record" is the last part of a zip archive, and is at least 22 bytes long.
  // Zip file comment is the last part of EOCDR and has max length of 64KB,
  // so we only have to search the last 64K + 22 bytes of a archive for EOCDR signature (0x06054b50).
  if (file.size < EOCDR_MIN) throw new Error(ERR_BAD_FORMAT);

  // seek last length bytes of file for EOCDR
  async function doSeek(length: number) {
    const ab = await file.slice(file.size - length).arrayBuffer();
    const bytes = new Uint8Array(ab);
    for (let i = bytes.length - EOCDR_MIN; i >= 0; i--) {
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x05 &&
        bytes[i + 3] === 0x06
      ) {
        return new DataView(bytes.buffer, i, EOCDR_MIN);
      }
    }

    return null;
  }

  // In most cases, the EOCDR is EOCDR_MIN bytes long
  let dv =
    (await doSeek(EOCDR_MIN)) || (await doSeek(Math.min(EOCDR_MAX, file.size)));

  if (!dv) throw new Error(ERR_BAD_FORMAT);

  let fileslength = dv.getUint16(8, true);
  let centralDirSize = dv.getUint32(12, true);
  let centralDirOffset = dv.getUint32(16, true);
  // const fileCommentLength = dv.getUint16(20, true);

  const isZip64 = centralDirOffset === MAX_VALUE_32BITS;

  if (isZip64) {
    const l = -dv.byteLength - 20;
    dv = new DataView(await file.slice(l, -dv.byteLength).arrayBuffer());

    // const signature = dv.getUint32(0, true) // 4 bytes
    // const diskWithZip64CentralDirStart = dv.getUint32(4, true) // 4 bytes
    const relativeOffsetEndOfZip64CentralDir = Number(getBigInt64(dv, 8, true)); // 8 bytes
    // const numberOfDisks = dv.getUint32(16, true) // 4 bytes

    const zip64centralBlob = file.slice(relativeOffsetEndOfZip64CentralDir, l);
    dv = new DataView(await zip64centralBlob.arrayBuffer());
    // const zip64EndOfCentralSize = dv.getBigInt64(4, true)
    // const diskNumber = dv.getUint32(16, true)
    // const diskWithCentralDirStart = dv.getUint32(20, true)
    // const centralDirRecordsOnThisDisk = dv.getBigInt64(24, true)
    fileslength = Number(getBigInt64(dv, 32, true));
    centralDirSize = Number(getBigInt64(dv, 40, true));
    centralDirOffset = Number(getBigInt64(dv, 48, true));
  }

  if (centralDirOffset < 0 || centralDirOffset >= file.size) {
    throw new Error(ERR_BAD_FORMAT);
  }

  const start = centralDirOffset;
  const end = centralDirOffset + centralDirSize;
  const blob = file.slice(start, end);
  const bytes = new Uint8Array(await blob.arrayBuffer());

  async function* read() {
    for (let i = 0, index = 0; i < fileslength; i++) {
      const size =
        uint16e(bytes, index + 28) + // filenameLength
        uint16e(bytes, index + 30) + // extraFieldLength
        uint16e(bytes, index + 32) + // commentLength
        46;

      if (index + size > bytes.length) {
        throw new Error("Invalid ZIP file.");
      }

      yield new Entry(new DataView(bytes.buffer, index, size), file);

      index += size;
    }
  }

  return { read, totalFiles: fileslength };
}

/* eslint-disable no-param-reassign */
class Crc32 {
  crc: number;
  constructor() {
    this.crc = -1;
  }

  append(data: Uint8Array) {
    let crc = this.crc | 0;
    const { table } = this;
    for (let offset = 0, len = data.length | 0; offset < len; offset++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xff];
    }
    this.crc = crc;
  }

  get() {
    return (this.crc ^ -1) >>> 0;
  }

  private table = ((table: number[], i: number, j: number, t: number) => {
    for (i = 0; i < 256; i++) {
      t = i;
      for (j = 0; j < 8; j++) {
        t = t & 1 ? (t >>> 1) ^ 0xedb88320 : t >>> 1;
      }
      table[i] = t;
    }
    return table;
  })([], 0, 0, 0);
}
