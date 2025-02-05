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

// Copyright 2022 Roy T. Hashimoto. All Rights Reserved.
import * as VFS from "./sqlite-constants.js";
export * from "./sqlite-constants.js";

// Base class for a VFS.
export class Base {
  mxPathName = 64;

  /**
   * @param {number} fileId
   * @returns {number}
   */
  xClose(fileId) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * @param {number} fileId
   * @param {Uint8Array} pData
   * @param {number} iOffset
   * @returns {number}
   */
  xRead(fileId, pData, iOffset) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * @param {number} fileId
   * @param {Uint8Array} pData
   * @param {number} iOffset
   * @returns {number}
   */
  xWrite(fileId, pData, iOffset) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * @param {number} fileId
   * @param {number} iSize
   * @returns {number}
   */
  xTruncate(fileId, iSize) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * @param {number} fileId
   * @param {*} flags
   * @returns {number}
   */
  xSync(fileId, flags) {
    return VFS.SQLITE_OK;
  }

  /**
   * @param {number} fileId
   * @param {DataView} pSize64
   * @returns {number}
   */
  xFileSize(fileId, pSize64) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * @param {number} fileId
   * @param {number} flags
   * @returns {number}
   */
  xLock(fileId, flags) {
    return VFS.SQLITE_OK;
  }

  /**
   * @param {number} fileId
   * @param {number} flags
   * @returns {number}
   */
  xUnlock(fileId, flags) {
    return VFS.SQLITE_OK;
  }

  /**
   * @param {number} fileId
   * @param {DataView} pResOut
   * @returns {number}
   */
  xCheckReservedLock(fileId, pResOut) {
    pResOut.setInt32(0, 0, true);
    return VFS.SQLITE_OK;
  }

  /**
   * @param {number} fileId
   * @param {number} op
   * @param {DataView} pArg
   * @returns {number}
   */
  xFileControl(fileId, op, pArg) {
    return VFS.SQLITE_NOTFOUND;
  }

  /**
   * @param {number} fileId
   * @returns {number}
   */
  xSectorSize(fileId) {
    return 512;
  }

  /**
   * @param {number} fileId
   * @returns {number}
   */
  xDeviceCharacteristics(fileId) {
    return 0;
  }

  /**
   * @param {string?} name
   * @param {number} fileId
   * @param {number} flags
   * @param {DataView} pOutFlags
   * @returns {number}
   */
  xOpen(name, fileId, flags, pOutFlags) {
    return VFS.SQLITE_CANTOPEN;
  }

  /**
   * @param {string} name
   * @param {number} syncDir
   * @returns {number}
   */
  xDelete(name, syncDir) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * @param {string} name
   * @param {number} flags
   * @param {DataView} pResOut
   * @returns {number}
   */
  xAccess(name, flags, pResOut) {
    return VFS.SQLITE_IOERR;
  }

  /**
   * Handle asynchronous operation. This implementation will be overridden on
   * registration by an Asyncify build.
   * @param {function(): Promise<number>} f
   * @returns {number}
   */
  handleAsync(f) {
    // This default implementation deliberately does not match the
    // declared signature. It will be used in testing VFS classes
    // separately from SQLite. This will work acceptably for methods
    // that simply return the handleAsync() result without using it.
    // @ts-ignore
    return f();
  }
}

export const FILE_TYPE_MASK = [
  VFS.SQLITE_OPEN_MAIN_DB,
  VFS.SQLITE_OPEN_MAIN_JOURNAL,
  VFS.SQLITE_OPEN_TEMP_DB,
  VFS.SQLITE_OPEN_TEMP_JOURNAL,
  VFS.SQLITE_OPEN_TRANSIENT_DB,
  VFS.SQLITE_OPEN_SUBJOURNAL,
  VFS.SQLITE_OPEN_SUPER_JOURNAL
].reduce((mask, element) => mask | element);
