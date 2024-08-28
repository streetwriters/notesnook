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
import { fdir } from "fdir";
import { Listr } from "listr2";

const args = parser(process.argv, { alias: { scope: ["s"], offline: ["o"] } });
const IS_CI = process.env.CI;
const THREADS = Math.max(4, process.env.THREADS || os.cpus().length / 2);
const scopes = {
  mobile: "apps/mobile",
  web: "apps/web",
  vericrypt: "apps/vericrypt",
  desktop: "apps/desktop",
  core: "packages/core",
  editor: "packages/editor",
  themes: "servers/themes",
  themebuilder: "apps/theme-builder"
};
// packages that we shouldn't run npm rebuild for
const IGNORED_NATIVE_PACKAGES = [
  // these get built by electron-builder automatically.
  ...(args.scope === "desktop"
    ? ["better-sqlite3-multiple-ciphers", "sodium-native"]
    : []),
  "electron",

  // optional dependency of pdfjs-dist, we can ignore
  // it because it's only needed in non-browser environments
  "canvas",
  // optional dependency only used on Node.js platform
  "@azure/msal-node-runtime",
  // not needed on mobile
  ...(args.scope === "mobile" ? ["esbuild"] : [])
];

if (args.scope && !scopes[args.scope])
  throw new Error(`Scope must be one of ${Object.keys(scopes).join(", ")}`);

const IS_BOOTSTRAP_ALL = !args.scope;

if (IS_BOOTSTRAP_ALL) {
  const allPackages = (
    await new fdir()
      .onlyDirs()
      .withMaxDepth(2)
      .glob("packages/**", "apps/**", "extensions/**", "servers/**")
      .crawl(".")
      .withPromise()
  ).slice(4);

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
  const tasks = new Listr(
    dependencies.map((dep) => ({
      task: () => bootstrapPackage(dep, outputs),
      title: "Bootstrapping " + dep
    })),
    {
      concurrent: THREADS,
      exitOnError: false
    }
  );

  console.time("Took");
  await tasks.run();

  process.stdout.write(outputs.stdout.join(""));
  process.stderr.write(outputs.stderr.join(""));

  console.timeEnd("Took");
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

        outputs.stdout.push(stdout);
        outputs.stderr.push(stderr);

        resolve();
      }
    )
  );
}

async function bootstrapPackage(cwd, outputs) {
  const cmd = `npm ${
    IS_CI ? "ci" : "i"
  } --legacy-peer-deps --no-audit --no-fund ${
    args.offline ? "--offline" : ""
  } --progress=false --ignore-scripts`;

  outputs.stdout.push("> " + cwd);

  await execute(cmd, cwd, outputs);

  const postInstallCommands = [];

  const packages = await needsRebuild(cwd);
  if (packages.length > 0) {
    postInstallCommands.push(`npm rebuild ${packages.join(" ")}`);
  }

  if (await hasScript(cwd, "postinstall"))
    postInstallCommands.push(`npm run postinstall `);

  for (const cmd of postInstallCommands) {
    let retries = 3;
    while (--retries > 0) {
      try {
        await execute(cmd, cwd, outputs);
        break;
      } catch (e) {
        console.error(e);
      }
    }
  }
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
    .filter(([key, value]) => value.startsWith("file:"))
    .map(([_, value]) =>
      path.resolve(path.join(basePath, value.replace("file:", "")))
    );
}

async function needsRebuild(cwd) {
  const scripts = ["preinstall", "install", "postinstall"];
  const packages = await new fdir()
    .glob("**/package.json")
    .withFullPaths()
    .crawl(path.join(cwd, "node_modules"))
    .withPromise();

  return (
    await Promise.all(
      packages.map(async (path) => {
        const pkg = await readFile(path, "utf-8")
          .then(JSON.parse)
          .catch(Object);

        if (
          !pkg ||
          !pkg.scripts ||
          IGNORED_NATIVE_PACKAGES.includes(pkg.name) ||
          !scripts.some((s) => pkg.scripts[s])
        )
          return;

        return pkg.name;
      })
    )
  ).filter(Boolean);
}

async function hasScript(cwd, scriptName) {
  const pkg = await readFile(path.join(cwd, "package.json"), "utf-8")
    .then(JSON.parse)
    .catch(Object);
  return pkg && pkg.scripts && pkg.scripts[scriptName];
}
