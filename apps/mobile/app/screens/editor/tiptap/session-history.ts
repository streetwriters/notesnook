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
export class SessionHistory extends Map {
  get(key: any) {
    let value = super.get(key);
    if (Date.now() - value > 5 * 60 * 1000) {
      value = Date.now();
      this.set(key, value);
    }
    return value;
  }
  newSession(noteId: string) {
    const value = Date.now();
    this.set(noteId, value);
    return value;
  }
  clearSession(noteId: string) {
    this.delete(noteId);
  }
}
