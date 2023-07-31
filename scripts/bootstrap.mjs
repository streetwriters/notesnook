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

import { exec } from "child_process";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";
import parser from "yargs-parser";
import glob from "fast-glob";
import Listr from "listr";

const THREADS = Math.min(4, process.env.THREADS || os.cpus().length / 2);
const args = parser(process.argv, { alias: { scope: ["s"], offline: ["o"] } });
const IS_CI = process.env.CI;
const scopes = {
  mobile: "apps/mobile",
  web: "apps/web",
  vericrypt: "apps/vericrypt",
  desktop: "apps/desktop",
  core: "packages/core",
  editor: "packages/editor"
};

if (args.scope && !scopes[args.scope])
  throw new Error(`Scope must be one of ${Object.keys(scopes).join(", ")}`);

const IS_BOOTSTRAP_ALL = !args.scope;

if (IS_BOOTSTRAP_ALL) {
  const allPackages = await glob(["packages/**", "apps/**", "extensions/**"], {
    deep: 1,
    onlyDirectories: true
  });

  const dependencies = Array.from(
    new Set(
      (
        await Promise.all(
          allPackages.map(async (scope) => await findDependencies(scope))
        )
      ).flat()
    ).values()
  );

  await bootstrapPackages(dependencies);
} else {
  const dependencies = await findDependencies(scopes[args.scope]);
  await bootstrapPackages(dependencies);
}

async function bootstrapPackages(dependencies) {
  console.log("> Found", dependencies.length, "dependencies to bootstrap.");
  console.log("> Using", THREADS, "threads.");

  const outputs = { stdout: [], stderr: [] };
  const tasks = new Listr({
    concurrent: THREADS,
    exitOnError: false
  });
  for (const dependency of dependencies) {
    tasks.add({
      task: () => bootstrapPackage(dependency, outputs),
      title: "Bootstrapping " + dependency
    });
  }

  console.time("Took");
  await tasks.run();

  process.stdout.write(outputs.stdout.join(""));
  process.stderr.write(outputs.stderr.join(""));

  console.timeEnd("Took");
}

function bootstrapPackage(cwd, outputs) {
  return new Promise((resolve, reject) =>
    exec(
      `npm ${IS_CI ? "ci" : "i"} --legacy-peer-deps --no-audit --no-fund ${
        args.offline ? "--offline" : "--prefer-offline"
      } --progress=false`,
      {
        cwd,
        env: process.env,
        stdio: "inherit"
      },
      (err, stdout, stderr) => {
        if (err) return reject(err);

        outputs.stdout.push("> " + cwd);
        outputs.stdout.push(stdout);
        outputs.stderr.push(stderr);

        resolve();
      }
    )
  );
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
    console.error("Failed to bootstrap", scope, "Error:", e);
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
