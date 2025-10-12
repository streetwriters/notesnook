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

import { execSync } from "child_process";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";
import { findDependencies, allPackages } from "./utils.mjs";
import { parseArgs } from "util";

const { values: args } = parseArgs({
  options: {
    scope: {
      type: "string",
      short: "s"
    },
    offline: {
      type: "boolean",
      short: "o",
      default: false
    }
  }
});
const IS_CI = process.env.CI;
const THREADS = Math.max(4, process.env.THREADS || os.cpus().length / 2);
const scopes = {
  mobile: "apps/mobile",
  web: "apps/web",
  monograph: "apps/monograph",
  vericrypt: "apps/vericrypt",
  desktop: "apps/desktop",
  core: "packages/core",
  editor: "packages/editor",
  themes: "servers/themes",
  themebuilder: "apps/theme-builder"
};

if (args.scope && !scopes[args.scope])
  throw new Error(`Scope must be one of ${Object.keys(scopes).join(", ")}`);

const IS_BOOTSTRAP_ALL = !args.scope;

if (IS_BOOTSTRAP_ALL) {
  const dependencies = Array.from(
    new Set(
      (
        await Promise.all(
          allPackages.map(
            async (scope) =>
              await findDependencies(scope, { includeSelf: true })
          )
        )
      ).flat()
    ).values()
  );

  await bootstrapPackages(dependencies);
} else {
  const dependencies = await findDependencies(scopes[args.scope], {
    includeSelf: true
  });
  await bootstrapPackages(dependencies);
}

async function bootstrapPackages(dependencies) {
  console.log("> Found", dependencies.length, "dependencies to bootstrap.");
  console.log("> Using", THREADS, "threads.");

  console.time("Took");

  for (const dep of dependencies) {
    console.log("Bootstrapping " + path.basename(dep));
    await bootstrapPackage(dep);
  }

  console.timeEnd("Took");
}

function execute(cmd, cwd) {
  execSync(cmd, {
    cwd,
    env: process.env,
    stdio: "inherit"
  });
}

async function bootstrapPackage(cwd) {
  const cmd = `bun install ${IS_CI ? "--frozen-lockfile" : ""} ${
    args.offline ? "--offline" : ""
  } --ignore-scripts`;

  execute(cmd, cwd);

  const postInstallCommands = [];

  if (await hasScript(cwd, "postinstall"))
    postInstallCommands.push(`bun run postinstall `);

  for (const cmd of postInstallCommands) {
    let retries = 3;
    while (--retries > 0) {
      try {
        console.log("Running postinstall command:", cmd, "in", cwd);
        execute(cmd, cwd);
        break;
      } catch (e) {
        console.error(e);
      }
    }
  }
}

async function hasScript(cwd, scriptName) {
  const pkg = await readFile(path.join(cwd, "package.json"), "utf-8")
    .then(JSON.parse)
    .catch(Object);
  return pkg && pkg.scripts && pkg.scripts[scriptName];
}
