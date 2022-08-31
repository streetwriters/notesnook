/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import Storage from "./storage";

export default class Indexer extends Storage {
  constructor(context, type) {
    super(context);
    this.type = type;
    this.indices = [];
  }

  async init() {
    this.indices = (await this.read(this.type, true)) || [];
  }

  exists(key) {
    return this.indices.includes(key);
  }

  async index(key) {
    if (this.exists(key)) return;
    this.indices.push(key);
    await this.write(this.type, this.indices);
  }

  getIndices() {
    return this.indices;
  }

  async deindex(key) {
    if (!this.exists(key)) return;
    this.indices.splice(this.indices.indexOf(key), 1);
    await this.write(this.type, this.indices);
  }

  async clear() {
    this.indices = [];
    await super.clear();
  }
}
