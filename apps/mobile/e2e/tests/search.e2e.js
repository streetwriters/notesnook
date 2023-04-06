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

import { notesnook } from "../test.ids";
import {
  tapById,
  visibleByText,
  createNote,
  prepare,
  elementById,
  sleep,
  tapByText
} from "./utils";

describe("Search", () => {
  it("Search for a note", async () => {
    await prepare();
    let note = await createNote();
    await tapById("icon-search");
    await sleep(300);
    await elementById("search-input").typeText("n");
    await sleep(1000);
    await tapByText(note.body);
    await sleep(1000);
    await device.pressBack();
    await device.pressBack();
    await visibleByText(note.body);
  });
});
