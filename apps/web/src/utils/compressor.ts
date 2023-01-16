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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Worker from "worker-loader?filename=static/workers/compressor.worker.[contenthash].js!./compressor.worker";
import type { Compressor as CompressorWorker } from "./compressor.worker";
import { wrap, Remote } from "comlink";
import { isDesktop } from "./platform";

export class Compressor {
  private worker!: globalThis.Worker;
  private compressor!: Remote<CompressorWorker>;

  constructor() {
    if (!isDesktop()) {
      this.worker = new Worker();
      this.compressor = wrap<CompressorWorker>(this.worker);
    }
  }

  async compress(data: string) {
    if (isDesktop()) return await window.native.gzip({ data, level: 6 });

    return await this.compressor.gzip({ data, level: 6 });
  }

  async decompress(data: string) {
    if (isDesktop()) return await window.native.gunzip({ data });

    return await this.compressor.gunzip({ data });
  }
}
