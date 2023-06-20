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
import { existsSync } from "fs";
import { argv, os } from "zx";
import * as childProcess from "child_process";

const sodiumNativePrebuildPath = (arch) =>
  path.join(
    `node_modules`,
    `@notesnook`,
    `crypto`,
    `node_modules`,
    `@notesnook`,
    `sodium`,
    `node_modules`,
    `sodium-native`,
    `prebuilds`,
    `${os.platform()}-${arch}`
  );

if (argv.rebuild) {
  await fs.rm("./build/", { force: true, recursive: true });

  await exec(
    `cd ${path.resolve(
      path.join(__dirname, "..", "web")
    )} && npm run build:desktop`
  );

  await fs.cp(path.join("..", "web", "build"), "build", {
    recursive: true,
    force: true
  });
}

if (argv.variant === "mas") {
  await exec(`npm run bundle:mas`);
} else {
  await exec(`npm run bundle`);
}

await exec(`npx tsc`);

if (existsSync(sodiumNativePrebuildPath("x64"))) {
  console.log("copying sodium-native-x64");
  await fs.cp(
    sodiumNativePrebuildPath("x64"),
    path.join("build", "prebuilds", `${process.platform}-x64`),
    {
      recursive: true,
      force: true
    }
  );
}

if (existsSync(sodiumNativePrebuildPath("ia32"))) {
  console.log("copying sodium-native-ia32");
  await fs.cp(
    sodiumNativePrebuildPath("ia32"),
    path.join("build", "prebuilds", `${process.platform}-ia32`),
    {
      recursive: true,
      force: true
    }
  );
}

if (existsSync(sodiumNativePrebuildPath("arm64"))) {
  console.log("copying sodium-native-arm64");
  await fs.cp(
    sodiumNativePrebuildPath("arm64"),
    path.join("build", "prebuilds", `${process.platform}-arm64`),
    {
      recursive: true,
      force: true
    }
  );
}

if (argv.run) {
  if (process.platform === "win32") {
    await exec(`npx electron-builder --win --x64`);
    // await exec(`.\\output\\notesnook_win_x64_portable.exe`);
  } else {
    await exec(`npx electron-builder --linux AppImage:x64`);
    // await exec(`./output/notesnook_linux_x86_64.AppImage`);
  }
}

async function exec(cmd) {
  return childProcess.execSync(cmd, {
    env: process.env,
    stdio: "inherit"
  });
}
