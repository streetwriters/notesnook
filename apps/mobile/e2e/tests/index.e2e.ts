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

import { Tests } from "./utils";

describe("APP LAUNCH AND NAVIGATION", () => {
  it("App should launch successfully & hide welcome screen", async () => {
    await Tests.prepare();
  });

  it("Basic navigation should work", async () => {
    await Tests.prepare();
    await Tests.navigate("Favorites");
    await Tests.navigate("Reminders");
    await Tests.navigate("Monographs");
    await Tests.navigate("Trash");
    await Tests.openSideMenu();
    await Tests.fromId("sidemenu-settings-icon").waitAndTap();
    await Tests.fromText("Settings").waitAndTap();
    await Tests.fromText("Settings").isVisible();
    await device.pressBack();

    await Tests.fromId("tab-notebooks").tap();
    await Tests.fromText("No notebooks").isVisible();
    await Tests.fromId("tab-tags").tap();
    await Tests.fromText("No tags").isVisible();
    await Tests.fromId("tab-home").tap();

    await Tests.fromText("Notes").tap();
    await Tests.fromText("Search in Notes").isVisible();

    // await Tests.navigate("Tags");
    // await Tests.navigate("Settings");

    // await Tests.navigate("Notebooks");
  });
});
