#!/usr/bin/env node
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

import { spawn } from "child_process";
import { existsSync, readFileSync } from "fs";
import { glob, readdir, readFile, rename, stat, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";
import { createHash } from "crypto";
import {
  allPackages,
  config,
  findDependencies,
  findPackages,
  readConfig,
  readJson,
  readPackage,
  root
} from "./utils.mjs";
import { parseArgs } from "util";

let { values: args, positionals } = parseArgs({
  options: {
    exclude: {
      type: "string",
      short: "e"
    },
    verbose: {
      type: "boolean",
      short: "v"
    },
    all: {
      type: "boolean",
      short: "a"
    },
    force: {
      type: "boolean",
      short: "f"
    }
  },
  allowPositionals: true
});
args.exclude = args.exclude?.split(",");
if (!positionals.length) {
  console.error("Missing required argument: package:task");
  process.exit(1);
}

const isVerbose = !!(process.env.CI || args.verbose);
const cachePath = path.join(root, ".taskcache");
const [project, ...taskParts] = args.all
  ? [null, ...positionals[0].split(":")]
  : positionals[0].split(":");
const cmd = taskParts.join(":");

const task = config.tasks?.find((t) => t.commands?.includes(cmd));
if (!task) {
  console.error(`Task "${cmd}" not found in taskRunner config.`);
  process.exit(1);
}

const resolvedPkgs = (
  await Promise.all(
    task.dependencies.flatMap((dep) =>
      allPackages.map((pkg) => resolvePkg(dep, pkg))
    )
  )
).filter(Boolean);

let cache = {};
try {
  cache = existsSync(cachePath) ? readJson(cachePath) : {};
} catch {
  if (isVerbose) console.warn("Failed to parse .taskcache");
}

function getPkgName(pkgPath) {
  return readPackage(pkgPath)?.name || path.basename(pkgPath);
}

function isPkg(path, name) {
  const pkgName = getPkgName(path);
  return pkgName === name || pkgName.endsWith(`/${name}`);
}

async function resolvePkg(command, pkgPath) {
  const json = readPackage(pkgPath);
  if (!json?.scripts?.[command]) return null;
  const deps = await findDependencies(pkgPath);
  const taskDeps = {};
  for (const dep of deps) {
    if (readPackage(dep)?.scripts?.[command]) {
      taskDeps[command] = taskDeps[command] || [];
      taskDeps[command].push(dep);
    }
  }
  return { path: pkgPath, cmd: command, taskDependencies: taskDeps };
}

async function runScript(command, pkg, opts) {
  opts = opts || {};
  const start = performance.now();
  const name = getPkgName(pkg);
  try {
    await new Promise((resolve, reject) => {
      const verbose = opts.verbose || isVerbose;
      const child = spawn(
        "bun",
        ["--bun", "run", command, ...(opts.args || [])],
        {
          cwd: pkg,
          stdio: verbose ? "inherit" : "pipe",
          shell: true
        }
      );
      let output = "";
      if (!verbose && child.stdout) {
        child.stdout.on("data", (data) => (output += data));
        child.stderr.on("data", (data) => (output += data));
      }
      child.once("exit", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`Exit code ${code}${output ? "\n" + output : ""}`))
      );
      child.once("error", reject);
    });
    console.log(
      `${name}:${command} took ${(performance.now() - start).toFixed(0)}ms`
    );
  } catch (err) {
    console.error(`${name}:${command} failed:`, err.message);
    throw err;
  }
}

function normalizePath(pathStr) {
  return path.resolve(pathStr).replace(/\/$/, "");
}

async function toBatches(pkgs, cmd) {
  const batches = [pkgs.filter((pkg) => !pkg.taskDependencies[cmd]?.length)];
  const remaining = pkgs
    .filter((pkg) => !!pkg.taskDependencies[cmd]?.length)
    .slice();

  while (remaining.length > 0) {
    const batch = [];
    for (const pkg of remaining.slice()) {
      if (
        pkg.taskDependencies[cmd].every((dep) =>
          batches.some((batch) =>
            batch.some(
              (batchPkg) => normalizePath(dep) === normalizePath(batchPkg.path)
            )
          )
        )
      ) {
        batch.push(pkg);
        remaining.splice(remaining.indexOf(pkg), 1);
      }
    }
    if (!batch.length) throw new Error("Cyclic dependencies detected");
    batches.push(batch);
  }
  return batches;
}

async function resolveRecursive(cmd, pkg, visited) {
  visited = visited || new Set();
  const result = [];
  const resolved = await resolvePkg(cmd, pkg);
  if (!resolved) return [];
  const rp = path.resolve(pkg);
  if (visited.has(rp)) return [];
  visited.add(rp);
  for (const dep of resolved.taskDependencies[cmd] || []) {
    for (const resolved of await resolveRecursive(cmd, dep, visited)) {
      if (!result.some((pkg) => pkg.path === resolved.path))
        result.push(resolved);
    }
  }
  result.push(resolved);
  return result;
}

const exclusions = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "locales",
  "coverage",
  "__e2e__",
  "__mocks__",
  "__tests__",
  "__benches__",
  "scripts",
  "test-artifacts",
  "output"
]);

async function computeChecksumFast(dir) {
  const hash = createHash("sha256");

  for (const entry of await readdir(dir, {
    withFileTypes: true
  })) {
    if (entry.isFile() && !exclusions.has(entry.name)) {
      const fullPath = path.join(entry.parentPath, entry.name);
      const fileStat = await stat(fullPath).catch(() => null);
      if (!fileStat) continue;
      hash.update(fullPath);
      hash.update(fileStat.mtimeMs.toString());
      hash.update(fileStat.size.toString());
    }
  }
  return hash.digest("hex");
}

async function computeChecksumSlow(dir) {
  const hash = createHash("sha256");
  const files = [];
  for (const entry of await readdir(dir, {
    withFileTypes: true
  })) {
    if (entry.isFile() && !exclusions.has(entry.name))
      files.push(path.join(entry.parentPath, entry.name));
  }
  files.sort();
  for (const file of files) {
    hash.update(path.relative(dir, file));
    hash.update(await readFile(file).catch(() => ""));
  }
  return hash.digest("hex");
}

function findKeyInObject(obj, key) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;
  if (key in obj) return obj[key];
  for (const value of Object.values(obj)) {
    const found = findKeyInObject(value, key);
    if (found) return found;
  }
}

function getBuildFolder(pkgPath) {
  const pkg = readPackage(pkgPath);
  if (!pkg) return null;
  let artifact =
    pkg.main ||
    pkg.module ||
    pkg.types ||
    pkg.typings ||
    findKeyInObject(pkg.exports, "default") ||
    findKeyInObject(pkg.exports, "types");
  if (!artifact) return null;
  const dir = path.join(pkgPath, artifact.replace(/^\.\//, "").split("/")[0]);
  return existsSync(dir) ? dir : null;
}

if (args.all) {
  console.time("Took");
  for (const dep of task.dependencies) {
    for (const batch of await toBatches(resolvedPkgs, dep)) {
      await Promise.all(
        batch
          .filter((pkg) => !args.exclude.some((name) => isPkg(pkg.path, name)))
          .map((task) => runScript(task.cmd, task.path))
      );
    }
  }
  console.timeEnd("Took");
} else {
  console.time("Ready in");
  const pkg = resolvedPkgs.find((candidate) => isPkg(candidate.path, project));
  if (!pkg) {
    console.error(`Package "${project}" not found.`);
    process.exit(1);
  }
  for (const dep of task.dependencies) {
    for (const batch of await toBatches(
      await resolveRecursive(dep, pkg.path),
      dep
    )) {
      await Promise.all(
        batch.map(async (item) => {
          if (item.path === pkg.path) return;
          const hasBuild = !!getBuildFolder(item.path);
          const key = item.path + ":" + item.cmd;
          const [fast, slow] = cache[key]?.split("|") || [];
          const fastHash = await computeChecksumFast(item.path);
          if (hasBuild && !args.force && fast === fastHash) return;
          const slowHash = await computeChecksumSlow(item.path);
          if (hasBuild && !args.force && slow === slowHash) return;
          await runScript(item.cmd, item.path);
          cache[key] = `${fastHash}|${slowHash}`;
        })
      );
    }
  }
  const tmp = cachePath + ".tmp";
  await writeFile(tmp, JSON.stringify(cache));
  await rename(tmp, cachePath);
  console.timeEnd("Ready in");
  await runScript(cmd, pkg.path, {
    verbose: true,
    args: ["--", ...positionals.slice(1)]
  });
}
