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

import { $, fs, path, which } from "zx";

function uniqBy(a, key) {
  let seen = new Set();
  return a.filter((item) => {
    let k = key(item);
    if (!k) return true;
    return seen.has(k) ? false : seen.add(k);
  });
}

$.env = process.env;
$.quote = (s) => s;

const generators = await which("flatpak-node-generator");

if (generators.length <= 0)
  throw new Error(
    "flatpak-node-generator not found. Please install flatpak-node-generator from https://github.com/flatpak/flatpak-builder-tools."
  );

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
  if (!fs.existsSync(lockfile.path)) {
    console.error("skipping. lockfile does not exist at", lockfile.path);
    continue;
  }
  console.log("generating sources for", lockfile.name);

  const nodeModulesPath = path.join(
    path.dirname(lockfile.path),
    "node_modules"
  );
  console.log("backing up node_modules at", nodeModulesPath);
  fs.moveSync(
    nodeModulesPath,
    path.join(path.dirname(lockfile.path), "node_modules.backup")
  );

  const output = `${lockfile.name}-sources.json`;
  await $`flatpak-node-generator${
    lockfile.ignoreDev ? " --no-devel" : ""
  } npm ${lockfile.path} -o ${output}`;

  const sources = JSON.parse(fs.readFileSync(output, "utf-8"));
  allSources = [...allSources, ...sources];

  fs.rmSync(output, { force: true });

  console.log("recovering node_modules to", nodeModulesPath);
  fs.moveSync(
    path.join(path.dirname(lockfile.path), "node_modules.backup"),
    nodeModulesPath
  );
}

console.log("writing sources");

fs.writeFileSync(
  "generated-sources.json",
  JSON.stringify(uniqBy(allSources, (i) => i.url))
);

console.log("done");
