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
import yargs from "yargs-parser";
import os from "os";
import * as childProcess from "child_process";
import { fileURLToPath } from "url";

const args = yargs(process.argv);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
const webAppPath = path.resolve(path.join(__dirname, "..", "..", "web"));
if (args.rebuild) {
  await fs.rm("./build/", { force: true, recursive: true });

  await exec(`cd ${webAppPath} && npm run build:desktop`);

  await fs.cp(path.join(webAppPath, "build"), "build", {
    recursive: true,
    force: true
  });
}

if (args.variant === "mas") {
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

if (args.run) {
  await exec(`npx electron-builder --dir --x64`);
  if (process.platform === "win32") {
    await exec(`.\\output\\win-unpacked\\Notesnook.exe`);
  } else if (process.platform === "darwin") {
    await exec(`./output/darwin-unpacked/Notesnook`);
  } else {
    await exec(`./output/linux-unpacked/Notesnook`);
  }
}

async function exec(cmd) {
  return childProcess.execSync(cmd, {
    env: process.env,
    stdio: "inherit"
  });
}
