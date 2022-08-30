/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { TEST_NOTE } from "../../__tests__/utils";
import { compress, decompress } from "../compression";

test("String should compress and decompress", () => {
  let compressed = compress(TEST_NOTE.content.data);
  expect(compressed).not.toBe(TEST_NOTE.content.data);

  let decompressed = decompress(compressed);
  expect(decompressed).toBe(TEST_NOTE.content.data);
});
