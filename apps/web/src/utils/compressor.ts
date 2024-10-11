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

import { desktop } from "../common/desktop-bridge";
import { ICompressor } from "@notesnook/core";
import { Foras, gzip, gunzip, Memory } from "@hazae41/foras";

export class Compressor implements ICompressor {
  private inititalized = false;
  private async init() {
    if (this.inititalized) return;
    await Foras.initBundledOnce();
    this.inititalized = true;
  }
  async compress(data: string) {
    if (IS_DESKTOP_APP && desktop)
      return await desktop.compress.gzip.query({ data, level: 6 });

    await this.init();
    const bytes = new Memory(new TextEncoder().encode(data));

    const res = gzip(bytes, 6);
    const base64 = Buffer.from(res.bytes).toString("base64");
    res.free();
    return base64;
  }

  async decompress(data: string) {
    if (IS_DESKTOP_APP && desktop)
      return await desktop.compress.gunzip.query(data);

    await this.init();
    const bytes = new Memory(Buffer.from(data, "base64"));

    const res = gunzip(bytes);
    const text = Buffer.from(res.bytes).toString("utf-8");
    res.free();
    return text;
  }
}
