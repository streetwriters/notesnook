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

import { navigate, tapByText, prepare, sleep } from "./utils";

describe("APP LAUNCH AND NAVIGATION", () => {
  it("App should launch successfully & hide welcome screen", async () => {
    await prepare();
  });

  it("Basic navigation should work", async () => {
    await prepare();
    await navigate("Notebooks");
    await tapByText("Skip introduction");
    await sleep(500);
    await navigate("Favorites");
    await navigate("Trash");
    await navigate("Tags");
    await navigate("Settings");
    await navigate("Monographs");
    await navigate("Reminders");
    await navigate("Notes");
  });
});
