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

// const { test, expect } = require("@playwright/test");
// const { getTestId, isTestAll, loginUser } = require("./utils");
// const path = require("path");

// /**
//  * @type {import("@playwright/test").Page}
//  */
// var page = null;
// global.page = null;
// test.beforeEach(async ({ page: _page, baseURL }) => {
//   global.page = _page;
//   page = _page;
//   await page.goto(baseURL);
//   await page.waitForSelector(getTestId("routeHeader"));
// });

// if (!isTestAll()) test.skip();

// test("login user & import notes", async () => {
//   await loginUser();

//   await page.click(getTestId("navitem-settings"));

//   await page.click(getTestId("settings-importer"));

//   await page.click(getTestId("settings-importer-import"));

//   const [fileChooser] = await Promise.all([
//     page.waitForEvent("filechooser"),
//     page.click(getTestId("import-dialog-select-files"))
//   ]);

//   await fileChooser.setFiles(path.join(__dirname, "data", "importer-data.zip"));

//   await page.click(getTestId("importer-dialog-notes"));

//   let titles = [];
//   for (let i = 0; i < 6; ++i) {
//     const noteId = getTestId(`note-${i}-title`);
//     const text = await page.innerText(noteId);
//     titles.push(text);
//   }

//   expect(titles.join("\n")).toMatchSnapshot("importer-notes-titles.txt");
// });
