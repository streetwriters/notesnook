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

import { TestBuilder } from "./utils";

describe("APP LAUNCH AND NAVIGATION", () => {
  it("App should launch successfully & hide welcome screen", async () => {
    await TestBuilder.create().prepare().run();
  });

  it("Basic navigation should work", async () => {
    await TestBuilder.create()
      .prepare()
      .navigate("Favorites")
      .navigate("Reminders")
      .navigate("Monographs")
      .navigate("Trash")
      .openSideMenu()
      .waitAndTapById("sidemenu-settings-icon")
      .wait(500)
      .waitAndTapByText("Settings")
      .isVisibleByText("Settings")
      .pressBack(1)
      .tapById("tab-notebooks")
      .isVisibleByText("No notebooks")
      .tapById("tab-tags")
      .isVisibleByText("No tags")
      .tapById("tab-home")
      .tapByText("Notes")
      .isVisibleByText("Search in Notes")
      .run();
  });
});
