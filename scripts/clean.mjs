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
import glob from "fast-glob";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import Listr from "listr";

const allPackages = await glob(["packages/**", "apps/**", "extensions/**"], {
  deep: 1,
  onlyDirectories: true
});

const tasks = new Listr({ concurrent: 4, exitOnError: false });
for (const pkg of allPackages) {
  const node_modules = path.join(pkg, "node_modules");
  if (!existsSync(node_modules)) continue;
  tasks.add({
    title: "Cleaning " + node_modules,
    task: () => fs.rm(node_modules, { recursive: true, force: true })
  });
}

console.time("Took");
await tasks.run();
console.timeEnd("Took");
