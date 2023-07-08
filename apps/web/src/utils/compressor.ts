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

import CompressorWorker from "./compressor.worker.ts?worker";
import type { Compressor as CompressorWorkerType } from "./compressor.worker";
import { wrap, Remote } from "comlink";

import { desktop } from "../common/desktop-bridge";

export class Compressor {
  private worker!: globalThis.Worker;
  private compressor!: Remote<CompressorWorkerType>;

  constructor() {
    if (!IS_DESKTOP_APP) {
      this.worker = new CompressorWorker();
      this.compressor = wrap<CompressorWorkerType>(this.worker);
    }
  }

  async compress(data: string) {
    if (IS_DESKTOP_APP)
      return await desktop?.compress.gzip.query({ data, level: 6 });

    return await this.compressor.gzip({ data, level: 6 });
  }

  async decompress(data: string) {
    if (IS_DESKTOP_APP) return await desktop?.compress.gunzip.query(data);

    return await this.compressor.gunzip({ data });
  }
}
