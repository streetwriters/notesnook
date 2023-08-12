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

/**
 *
 * @param {number} size
 * @returns {Buffer}
 */
export function randomBytes(size) {
  if (!globalThis.crypto || !crypto)
    throw new Error("Crypto is not supported on this platform.");
  if (crypto.randomBytes) return crypto.randomBytes(size);

  if (!crypto.getRandomValues)
    throw new Error(
      "Crypto.getRandomValues is not available on this platform."
    );

  const buffer = Buffer.allocUnsafe(size);
  crypto.getRandomValues(buffer);
  return buffer;
}

export function randomInt() {
  const randomBuffer = randomBytes(1);
  let randomNumber = randomBuffer[0] / 0xff; // / (0xffffffff + 1);

  return Math.floor(randomNumber * 0xffffff);
}
