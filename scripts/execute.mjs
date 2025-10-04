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
import { fdir } from "fdir";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import parser from "yargs-parser";

const args = parser(process.argv, {
  alias: { force: ["-f"], verbose: ["-v"] }
});
const isVerbose = process.env.CI || args.verbose;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(
  readFileSync(path.join(__dirname, "..", "package.json"), "utf-8")
).taskRunner;
const cache = JSON.parse(
  existsSync(path.join(__dirname, "..", ".taskcache"))
    ? readFileSync(path.join(__dirname, "..", ".taskcache"), "utf-8")
    : "{}"
);

let [project, ...taskParts] = process.argv.slice(2)[0].split(":");
const task = taskParts.join(":");

const allPackages = (
  await new fdir()
    .onlyDirs()
    .withMaxDepth(2)
    .glob(...config.projects)
    .crawl(".")
    .withPromise()
).slice(4);

for (const pkg of allPackages) {
  if (isPackage(pkg, project)) {
    project = pkg;
    break;
  }
}

const pipeline = await buildExecutionPipeline(
  config.taskDependencies[task],
  project
);
console.log("Found", pipeline.length, "dependencies to run.");
for (const item of pipeline) {
  const checksum = await computeDirectoryChecksum(item.dep);
  if (checksum === cache[item.dep + ":" + item.cmd]) continue;

  await runScript(item.cmd, item.dep);

  cache[item.dep + ":" + item.cmd] = checksum;
}

await runScript(task, project);

writeFileSync(
  path.join(__dirname, "..", ".taskcache"),
  JSON.stringify(cache, null, 2)
);

async function runScript(command, pkg) {
  console.log(`Running "${command}" for ${pkg}`);

  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["run", command], {
      cwd: pkg,
      stdio: isVerbose ? "inherit" : "pipe",
      shell: true
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function buildExecutionPipeline(commands, pkg) {
  if (commands.length === 0) return [];

  const executionPipeline = [];
  const deps = await findDependencies(pkg);
  for (const dep of deps) {
    if (executionPipeline.some((item) => item.dep === dep)) continue;

    const pipeline = await buildExecutionPipeline(commands, dep);
    for (const item of pipeline) {
      if (executionPipeline.some((i) => i.dep === item.dep)) continue;
      executionPipeline.push(item);
    }

    const json = JSON.parse(
      readFileSync(path.join(dep, "package.json"), "utf-8")
    );
    for (const cmd of commands) {
      if (json.scripts && json.scripts[cmd]) {
        executionPipeline.push({
          cmd,
          dep
        });
        break;
      }
    }
  }

  return executionPipeline;
}

function isPackage(pkg, name) {
  const json = JSON.parse(
    readFileSync(path.join(pkg, "package.json"), "utf-8")
  );
  return json.name === name;
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

async function computeDirectoryChecksum(dir) {
  const exclusions = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    "locales",
    "coverage"
  ];
  const crypto = await import("crypto");
  const hash = crypto.createHash("sha256");
  const files = (
    await new fdir()
      .withFullPaths()
      .exclude((dir) => exclusions.some((ex) => dir.includes(ex)))
      .crawl(path.join(dir))
      .withPromise()
  ).sort();

  for (const filePath of files) {
    const fileBuffer = await readFile(filePath);
    hash.update(fileBuffer);
  }

  return hash.digest("hex");
}
