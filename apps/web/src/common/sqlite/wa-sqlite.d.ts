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

// wa-sqlite ships no declarations for these modules.

declare module "wa-sqlite/src/FacadeVFS.js" {
  import * as VFS from "wa-sqlite/src/VFS.js";

  type Result = number | Promise<number>;
  export class FacadeVFS extends VFS.Base {
    jOpen(
      filename: string | null,
      fileId: number,
      flags: number,
      pOutFlags: DataView
    ): Result;
    jClose(fileId: number): Result;
    jRead(fileId: number, pData: Uint8Array, iOffset: number): Result;
    jFileSize(fileId: number, pSize64: DataView): Result;
    jLock(fileId: number, lockType: number): Result;
    jUnlock(fileId: number, lockType: number): Result;
  }
}

declare module "wa-sqlite/src/examples/IDBBatchAtomicVFS.js" {
  import { FacadeVFS } from "wa-sqlite/src/FacadeVFS.js";

  export class IDBBatchAtomicVFS extends FacadeVFS {
    static create(
      name: string,
      module: unknown,
      options?: {
        idbName?: string;
        lockPolicy?: "exclusive" | "shared" | "shared+hint";
        lockTimeout?: number;
      }
    ): Promise<IDBBatchAtomicVFS>;
    delete(): Promise<void>;
  }
}

declare module "wa-sqlite/src/examples/AccessHandlePoolVFS.js" {
  import { FacadeVFS } from "wa-sqlite/src/FacadeVFS.js";

  export class AccessHandlePoolVFS extends FacadeVFS {
    static create(name: string, module: unknown): Promise<AccessHandlePoolVFS>;
    delete(): Promise<void>;
  }
}
