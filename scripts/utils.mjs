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
import { existsSync, readFileSync } from "fs";
import { glob } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const depMemo = new Map();
const pkgCache = new Map();
export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = __dirname.includes("@notesnook")
  ? path.join(__dirname, "..", "..", "..")
  : path.join(__dirname, "..");
export const config = readConfig();
export const allPackages = await findPackages(config.projects, root);

export async function findPackages(projects, root) {
  const pkgs = [];
  for await (const entry of glob(projects)) {
    const pkgPath = path.join(root, entry);
    if (existsSync(path.join(pkgPath, "package.json")))
      pkgs.push(path.resolve(pkgPath));
  }
  return pkgs;
}

export async function findDependencies(packagePath, { includeSelf }) {
  const key = path.resolve(packagePath);
  if (depMemo.has(key)) return Array.from(depMemo.get(key));
  const pkg = readPackage(packagePath);
  if (!pkg) {
    depMemo.set(key, []);
    return [];
  }
  const dependencies = new Set(
    filterDependencies({ ...pkg.dependencies, ...pkg.devDependencies })
  );
  for (const dep of dependencies)
    for (const c of await findDependencies(dep, { includeSelf }))
      dependencies.add(c);

  if (includeSelf) dependencies.add(path.resolve(packagePath));
  depMemo.set(key, dependencies);
  return Array.from(dependencies);
}

function filterDependencies(deps) {
  if (!deps) return [];
  let filteredDeps = [];
  for (const [key, value] of Object.entries(deps))
    if (key.startsWith("@notesnook/") && value.startsWith("link:")) {
      const path = findPackagePath(key, allPackages);
      filteredDeps.push(path);
    }
  return filteredDeps;
}

export function findPackagePath(name, packages) {
  for (const pkg of packages) {
    const json = readPackage(pkg);
    if (name === json?.name) return pkg;
  }
}

export function readPackage(pkgPath) {
  const key = path.resolve(pkgPath);
  if (pkgCache.has(key)) return pkgCache.get(key);
  try {
    const json = readJson(path.join(pkgPath, "package.json"));
    pkgCache.set(key, json);
    return json;
  } catch {
    return null;
  }
}

export function readJson(jsonPath) {
  try {
    return JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch {
    return;
  }
}

export function readConfig() {
  const rootPackage = readPackage(root);
  const config = rootPackage.taskRunner || {
    projects: ["packages/*"],
    tasks: []
  };
  return config;
}

export async function runTasks(tasks, options = {}) {
  const { concurrent = 1, exitOnError = true } = options;

  const results = [];
  const queue = [...tasks];
  const running = new Set();
  let hasError = false;

  async function executeTask(task, index) {
    const startTime = Date.now();

    try {
      console.log(`> ${task.title}`);
      const result = await task.task();

      const duration = Date.now() - startTime;
      console.log(`[Done] ${task.title} (${duration}ms)`);

      results[index] = result;
    } catch (error) {
      console.log(`[Failed] ${task.title} (${error.message})`);

      hasError = true;
      results[index] = { error };
    } finally {
      running.delete(task);
    }
  }

  await new Promise((resolve) => {
    function next() {
      if (hasError && exitOnError) {
        return resolve();
      }

      if (queue.length === 0 && running.size === 0) {
        return resolve();
      }

      while (running.size < concurrent && queue.length > 0) {
        const task = queue.shift();
        const index = tasks.indexOf(task);

        running.add(task);
        executeTask(task, index).then(next);
      }
    }

    next();
  });

  if (hasError && exitOnError) {
    throw new Error("Task execution failed");
  }

  return results;
}
