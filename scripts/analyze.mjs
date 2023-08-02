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

import { readFile } from "fs/promises";
import path from "path";
import parser from "yargs-parser";

const args = parser(process.argv, { alias: { scope: ["s"] } });
const scopes = {
  mobile: "apps/mobile",
  web: "apps/web",
  desktop: "apps/desktop",
  core: "packages/core",
  editor: "packages/editor"
};

if (!args.scope || !scopes[args.scope])
  throw new Error(`Scope must be one of ${Object.keys(scopes).join(", ")}`);

const dependencies = await findDependencies(scopes[args.scope]);
await analyzePackages(dependencies);

async function analyzePackages(dependencies) {
  console.log("> Found", dependencies.length, "dependencies to analyze.");
  console.time("Took");
  const allDeps = {};
  for (const dep of dependencies) {
    const packageJsonPath = path.join(dep, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    allDeps[dep] = packageJson.dependencies;
  }

  for (const dep of dependencies) {
    for (const dependency in allDeps[dep]) {
      const version = allDeps[dep][dependency];
      if (version.startsWith("file:")) continue;

      for (const d of dependencies) {
        if (
          d !== dep &&
          allDeps[d] &&
          allDeps[d][dependency] &&
          allDeps[d][dependency] !== version
        )
          console.log(
            dependency,
            "has different versions in",
            path.basename(d),
            allDeps[d][dependency],
            "and",
            path.basename(dep),
            allDeps[dep][dependency]
          );
      }
    }
  }
  console.timeEnd("Took");
}

async function findDependencies(scope) {
  try {
    const packageJsonPath = path.join(scope, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

    const dependencies = new Set([
      ...filterDependencies(scope, packageJson.dependencies),
      ...filterDependencies(scope, packageJson.devDependencies),
      ...filterDependencies(scope, packageJson.optionalDependencies),
      ...filterDependencies(scope, packageJson.peerDependencies)
    ]);

    for (const dependency of dependencies) {
      (await findDependencies(dependency)).forEach((v) => dependencies.add(v));
    }

    dependencies.add(path.resolve(scope));
    return Array.from(dependencies.values());
  } catch (e) {
    console.error("Failed to find dependencies for", scope, "Error:", e);
    return [];
  }
}

function filterDependencies(basePath, dependencies) {
  if (!dependencies) return [];
  return Object.entries(dependencies)
    .filter(
      ([key, value]) =>
        key.startsWith("@notesnook/") || value.startsWith("file:")
    )
    .map(([_, value]) =>
      path.resolve(path.join(basePath, value.replace("file:", "")))
    );
}
