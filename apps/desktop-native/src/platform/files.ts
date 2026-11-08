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

export interface PickedFile {
  name: string;
  size: number;
  type: string;
  uri: string;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
}

export interface PickOptions {
  acceptedFileTypes: string;
  multiple?: boolean;
}

export interface WritableFile {
  write(chunk: Uint8Array): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}

export interface Files {
  pick(options: PickOptions): Promise<PickedFile[]>;
  create(filename: string): Promise<WritableFile>;
  createAt(path: string): Promise<WritableFile>;
}
