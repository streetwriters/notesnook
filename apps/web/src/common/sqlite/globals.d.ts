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
/* eslint-disable no-var */

declare namespace Asyncify {
  function handleAsync(f: () => Promise<any>);
}

declare function UTF8ToString(ptr: number): string;
declare function lengthBytesUTF8(s: string): number;
declare function stringToUTF8(s: string, p: number, n: number);
declare function ccall(
  name: string,
  returns: string,
  args: Array<any>,
  options?: object
): any;
declare function getValue(ptr: number, type: string): number;
declare function setValue(ptr: number, value: number, type: string): number;
declare function mergeInto(library: object, methods: object): void;

declare var HEAPU8: Uint8Array;
declare var HEAPU32: Uint32Array;
declare var LibraryManager;
declare var Module;
declare var _vfsAccess;
declare var _vfsCheckReservedLock;
declare var _vfsClose;
declare var _vfsDelete;
declare var _vfsDeviceCharacteristics;
declare var _vfsFileControl;
declare var _vfsFileSize;
declare var _vfsLock;
declare var _vfsOpen;
declare var _vfsRead;
declare var _vfsSectorSize;
declare var _vfsSync;
declare var _vfsTruncate;
declare var _vfsUnlock;
declare var _vfsWrite;

declare var _jsFunc;
declare var _jsStep;
declare var _jsFinal;

declare var _modStruct;
declare var _modCreate;
declare var _modConnect;
declare var _modBestIndex;
declare var _modDisconnect;
declare var _modDestroy;
declare var _modOpen;
declare var _modClose;
declare var _modFilter;
declare var _modNext;
declare var _modEof;
declare var _modColumn;
declare var _modRowid;
declare var _modUpdate;
declare var _modBegin;
declare var _modSync;
declare var _modCommit;
declare var _modRollback;
declare var _modFindFunction;
declare var _modRename;

declare var _jsAuth;

declare var _jsProgress;
