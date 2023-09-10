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

class Outbox {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.outbox = {};
  }

  async init() {
    this.outbox = (await this._db.storage.read("outbox")) || {};

    for (var id in this.outbox) {
      const data = this.outbox[id];
      switch (id) {
        case "reset_password":
        case "change_password":
          if (await this._db.user._updatePassword(id, data))
            await this.delete(id);
          break;
      }
    }
  }

  async add(id, data, action) {
    this.outbox[id] = data;
    await this._db.storage.write("outbox", this.outbox);
    await action();
    await this.delete(id);
  }

  delete(id) {
    delete this.outbox[id];
    return this._db.storage.write("outbox", this.outbox);
  }
}
export default Outbox;
