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

import FileHandle from "./filehandle";
import { File } from "./types";

export interface IStreamableFS {
  createFile(filename: string, size: number, type: string): Promise<FileHandle>;
  readFile(filename: string): Promise<FileHandle | undefined>;
  exists(filename: string): Promise<boolean>;
  deleteFile(filename: string): Promise<boolean>;
  clear(): Promise<void>;
}

export interface IFileStorage {
  clear(): Promise<void>;
  setMetadata(filename: string, metadata: File): Promise<void>;
  getMetadata(filename: string): Promise<File | undefined>;
  deleteMetadata(filename: string): Promise<void>;
  writeChunk(chunkName: string, data: Uint8Array): Promise<void>;
  deleteChunk(chunkName: string): Promise<void>;
  readChunk(chunkName: string): Promise<Uint8Array | undefined>;
  listChunks(chunkPrefix: string): Promise<string[]>;
}
