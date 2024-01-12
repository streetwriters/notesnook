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

export function generatePassword() {
  return window.crypto
    .getRandomValues(new BigUint64Array(4))
    .reduce((prev, curr, index) => {
      const char =
        index % 2 ? curr.toString(36).toUpperCase() : curr.toString(36);
      return prev + char;
    }, "")
    .split("")
    .sort(() => 128 - window.crypto.getRandomValues(new Uint8Array(1))[0])
    .join("");
}
