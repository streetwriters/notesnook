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
import fs, { readFile, writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import yargs from "yargs-parser";
import os from "os";
import * as childProcess from "child_process";
import { fileURLToPath } from "url";

const args = yargs(process.argv);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
);

const webAppPath = path.resolve(path.join(__dirname, "..", "..", "web"));

await fs.rm("./build/", { force: true, recursive: true });

if (args.rebuild || !existsSync(path.join(webAppPath, "build"))) {
  await exec(
    "yarn nx build:desktop @notesnook/web",
    path.join(__dirname, "..", "..", "..")
  );
}

// temporary until there's support for prebuilt binaries for linux ARM
if (os.platform() === "linux") await patchBetterSQLite3();

// if (os.platform() === "win32")
//   await exec(
//     `npx prebuildify --arch=arm64 --strip -t electron@${packageJson.devDependencies.electron}`,
//     path.join(__dirname, "..", "node_modules", "sodium-native")
//   );

await fs.cp(path.join(webAppPath, "build"), "build", {
  recursive: true,
  force: true
});

if (args.variant === "mas") {
  await exec(`yarn run bundle:mas`);
} else {
  await exec(`yarn run bundle`);
}

await exec(`yarn tsc`);

if (args.run) {
  await exec(`yarn electron-builder --dir --x64`);
  if (process.platform === "win32") {
    await exec(`.\\output\\win-unpacked\\Notesnook.exe`);
  } else if (process.platform === "darwin") {
    await exec(`./output/mac/Notesnook.app/Contents/MacOS/Notesnook`);
  } else {
    await exec(`./output/linux-unpacked/Notesnook`);
  }
}

async function exec(cmd, cwd) {
  return childProcess.execSync(cmd, {
    env: { ...process.env, NOTESNOOK_STAGING: true },
    stdio: "inherit",
    cwd: cwd || process.cwd()
  });
}

async function patchBetterSQLite3() {
  const jsonPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "better-sqlite3-multiple-ciphers",
    "package.json"
  );
  const json = JSON.parse(await readFile(jsonPath, "utf-8"));

  json.version = "11.2.2";
  json.homepage = "https://github.com/thecodrr/better-sqlite3-multiple-ciphers";
  json.repository.url =
    "git://github.com/thecodrr/better-sqlite3-multiple-ciphers.git";

  await writeFile(jsonPath, JSON.stringify(json));
}
