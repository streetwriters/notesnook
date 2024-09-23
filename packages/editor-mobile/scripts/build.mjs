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

import { rm, cp, readdir } from "fs/promises";
import path from "path";

await rm("build.bundle", { recursive: true, force: true });
await rm("sourcemaps", { recursive: true, force: true });

await cp("build", "build.bundle", { recursive: true });
await rm("build", { recursive: true, force: true });

await cp(path.join("build.bundle", "static", "js"), "sourcemaps", {
  recursive: true
});

for (const dirent of await readdir(path.join("build.bundle", "static", "js"), {
  withFileTypes: true
})) {
  if (dirent.isFile() && dirent.name.endsWith(".map")) {
    await rm(path.join("build.bundle", "static", "js", dirent.name));
  }
}
