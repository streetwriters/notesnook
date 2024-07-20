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

// Publish steps
// find packages (with packages that have no internal dependencies at the top)
// start publishing
// bump version
// before publishing each package, replace the local path with the latest version of that dependency
// after publishing, undo the changes

import { exec } from "child_process";
import path from "path";
import { readFile, writeFile, cp, rm } from "fs/promises";
import glob from "fast-glob";
import parser from "yargs-parser";
import { Listr } from "listr2";

const args = parser(process.argv, { alias: { scope: ["s"], version: ["v"] } });
const allPackages = await glob("packages/*", {
  onlyDirectories: true
});

if (!args.version) throw new Error("version is required.");

const packages = Array.from(
  new Set(
    (
      await Promise.all(
        allPackages.map(async (scope) => await findDependencies(scope))
      )
    )
      .sort((a, b) => a.length - b.length)
      .flat()
  ).values()
);
await publishPackages(packages);

async function publishPackages(dependencies) {
  console.log("> Found", dependencies.length, "dependencies to bootstrap.");

  const outputs = { stdout: [], stderr: [] };
  await performTasks("bump", dependencies, (dep) => bumpVersion(dep, outputs));

  try {
    await performTasks("resolve local packages", dependencies, (dep) =>
      resolveLocalPackages(dep)
    );

    await performTasks("dry run", dependencies, (dep) =>
      publishPackage(dep, true)
    );

    await performTasks("publish", dependencies, (dep) =>
      publishPackage(dep, false, outputs)
    );
  } finally {
    await performTasks("unresolve", dependencies, (dep) =>
      unresolveLocalPackages(dep)
    );
  }

  process.stdout.write(outputs.stdout.join(""));
  process.stderr.write(outputs.stderr.join(""));
}

async function performTasks(title, dependencies, action) {
  const tasks = new Listr(
    dependencies.map((dep) => ({
      task: (_, task) => action(dep, task),
      title: title + " " + dep
    })),
    {
      concurrent: 8,
      exitOnError: true
    }
  );

  await tasks.run();

  if (tasks.errors.length > 0) throw new Error("Failed.");
}

async function bumpVersion(cwd, outputs) {
  const bumpCmd = `npm version ${args.version} --no-git-tag-version`;
  await execute(bumpCmd, cwd, outputs);
}

async function resolveLocalPackages(cwd) {
  const packageJsonPath = path.join(cwd, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));

  const allDependencies = [
    packageJson.dependencies,
    packageJson.devDependencies,
    packageJson.optionalDependencies,
    packageJson.peerDependencies
  ];

  const resolved = await Promise.all(
    allDependencies.map((deps) => resolveDependencies(cwd, deps))
  );

  await cp(packageJsonPath, packageJsonPath + ".old");
  await writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, undefined, 2) + "\n"
  );

  return { resolved, allDependencies, packageJson };
}

async function unresolveLocalPackages(cwd) {
  const packageJsonPath = path.join(cwd, "package.json");
  await cp(packageJsonPath + ".old", packageJsonPath, {
    force: true
  });
  await rm(packageJsonPath + ".old", { force: true });
}

async function publishPackage(cwd, dryRun, outputs) {
  const publishCmd = `npm publish --access public${dryRun ? " --dry-run" : ""}`;
  await execute(publishCmd, cwd, outputs);
}

async function findDependencies(scope) {
  try {
    const packageJsonPath = path.join(scope, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    if (packageJson.private) return [];

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
    .filter(([key, value]) => value.startsWith("file:"))
    .map(([_, value]) =>
      path.resolve(path.join(basePath, value.replace("file:", "")))
    );
}

async function resolveDependencies(basePath, dependencies) {
  const resolvedDependencies = {};
  for (const name in dependencies) {
    const version = dependencies[name];
    if (!version.startsWith("file:")) continue;
    const packageJsonPath = path.join(
      path.resolve(path.join(basePath, version.replace("file:", ""))),
      "package.json"
    );
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
    dependencies[name] = `^${packageJson.version}`;
    resolvedDependencies[name] = version;
  }
  return resolvedDependencies;
}

function execute(cmd, cwd, outputs) {
  return new Promise((resolve, reject) =>
    exec(
      cmd,
      {
        cwd,
        env: process.env,
        stdio: "inherit"
      },
      (err, stdout, stderr) => {
        if (err) return reject(err);

        if (outputs) {
          outputs.stdout.push(stdout);
          outputs.stderr.push(stderr);
        }

        resolve();
      }
    )
  );
}
