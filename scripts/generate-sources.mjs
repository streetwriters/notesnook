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
import fsSync from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

async function move(from, to) {
  if (!fsSync.existsSync(from) || fsSync.existsSync(to)) return;
  try {
    await fs.rename(from, to);
  } catch {
    await fs.cp(from, to, { overwrite: true, force: true, recursive: true });
    await fs.rm(from, { force: true, recursive: true });
  }
}

function execute(cmd, args) {
  spawnSync(cmd, args, { env: process.env, stdio: "inherit" });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lockfiles = [
  {
    name: "main",
    path: path.join(__dirname, "..", "package-lock.json"),
    ignoreDev: true
  },
  {
    name: "desktop",
    path: path.join(__dirname, "..", "apps", "desktop", "package-lock.json")
  },
  {
    name: "sodium",
    path: path.join(__dirname, "..", "packages", "sodium", "package-lock.json")
  },
  {
    name: "crypto",
    path: path.join(__dirname, "..", "packages", "crypto", "package-lock.json")
  }
];

let allSources = [];
for (const lockfile of lockfiles) {
  if (!fsSync.existsSync(lockfile.path)) {
    console.error("skipping. lockfile does not exist at", lockfile.path);
    continue;
  }
  console.log("generating sources for", lockfile.name);

  const nodeModulesPath = path.join(
    path.dirname(lockfile.path),
    "node_modules"
  );
  console.log("backing up node_modules at", nodeModulesPath);
  await move(
    nodeModulesPath,
    path.join(path.dirname(lockfile.path), "node_modules.backup")
  );

  const output = `${lockfile.name}-sources.json`;
  execute(
    `flatpak-node-generator`,
    [
      lockfile.ignoreDev ? "--no-devel" : false,
      "npm",
      lockfile.path,
      "-o",
      output
    ].filter(Boolean)
  );

  const sources = JSON.parse(await fs.readFile(output, "utf-8"));
  allSources = [...allSources, ...sources];

  await fs.rm(output, { force: true });

  console.log("recovering node_modules to", nodeModulesPath);
  await move(
    path.join(path.dirname(lockfile.path), "node_modules.backup"),
    nodeModulesPath
  );
}

console.log("writing sources");

for (const source of allSources) {
  for (let key in source) {
    const value = source[key];
    if (typeof value === "string" && value.includes("\\"))
      source[key] = source[key].replace(/\\/gm, "/");
    else if (Array.isArray(value)) {
      value.forEach((elem, index) => {
        value[index] = elem.replace(/\\/gm, "/");
      });
    }
  }
}

await fs.writeFile(
  "generated-sources.json",
  JSON.stringify(allSources, undefined, 4)
);

console.log("done");
