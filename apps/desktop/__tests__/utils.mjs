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

import { _electron as electron } from "playwright";

const executablePath = process.env.EXECUTABLE_PATH;

// process.platform === "linux"
//   ? "output/linux-unpacked/Notesnook"
//   : process.platform === "darwin"
//   ? "output/mac/Notesnook.app/Contents/MacOS/Notesnook"
//   : "output/win-unpacked/Notesnook.exe";

export async function launchApp() {
  const app = await electron.launch({
    executablePath
  });

  const page = await app.firstWindow();

  return { app, page };
}
