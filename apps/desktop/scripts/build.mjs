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

import path from "path";
import fs from "fs/promises";
import { $, argv, os } from "zx";

$.env = process.env;

const sodiumNativePrebuildPath = path.join(
  `node_modules`,
  `@notesnook`,
  `crypto`,
  `node_modules`,
  `@notesnook`,
  `sodium`,
  `node_modules`,
  `sodium-native`,
  `prebuilds`,
  `${os.platform()}-x64`
);

if (argv.rebuild) {
  await fs.rm("./build/", { force: true, recursive: true });

  await $`cd ../web/ && npm run build:desktop`;

  await fs.cp(path.join("..", "web", "build"), "build", {
    recursive: true,
    force: true
  });
}

if (argv.variant === "mas") {
  await $`npm run bundle:mas`;
} else {
  await $`npm run bundle`;
}

await $`tsc`;
await $`npm rebuild`;

await fs.cp(
  sodiumNativePrebuildPath,
  path.join("build", "prebuilds", `${process.platform}-x64`),
  {
    recursive: true,
    force: true
  }
);

if (argv.run) {
  await $`npm run builder -- --linux AppImage:x64`;

  await $`./output/notesnook_linux_x86_64.AppImage`;
}
