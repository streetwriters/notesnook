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

import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { findPackages, readConfig, runTasks } from "./utils.mjs";

const config = readConfig();
const allPackages = await findPackages(config.projects);

const tasks = [];
for (const pkg of allPackages) {
  for (const dirname of ["node_modules", "dist", "build", "out"]) {
    const dir = path.join(pkg, dirname);
    if (existsSync(dir))
      tasks.push({
        title: "Cleaning " + dir,
        task: () => fs.rm(dir, { recursive: true, force: true })
      });
  }
}

console.time("Took");
await runTasks(tasks, { concurrent: 8, exitOnError: false });
console.timeEnd("Took");
