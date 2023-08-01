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

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { Mutex } from "async-mutex";

type Counts = Record<string, string[]>;
export class Counter {
  private path: string;
  private readonly mutex: Mutex;
  constructor(id: string, baseDirectory: string) {
    this.path = path.join(baseDirectory, `${id}.json`);
    this.mutex = new Mutex();
  }

  async increment(key: string, uid: string) {
    await this.mutex.runExclusive(async () => {
      const counts = await this.counts();
      counts[key] = counts[key] || [];
      if (counts[key].includes(uid)) return;
      counts[key].push(uid);
      await this.save(counts);
    });
  }

  private async save(counts: Counts) {
    await writeFile(this.path, JSON.stringify(counts));
  }

  async counts(): Promise<Counts> {
    try {
      return JSON.parse(await readFile(this.path, "utf-8"));
    } catch {
      return {};
    }
  }
}
