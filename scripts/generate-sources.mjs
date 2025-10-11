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
import os from "os";
import fsSync, { readFileSync, writeFileSync } from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { findPackagePath, findPackages } from "./utils.mjs";

const customRoot = process.argv[2] === "--root";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_PATH = customRoot ? process.argv[3] : path.join(__dirname, "..");
const IS_ROOT_URL = ROOT_PATH.startsWith("https://");

function execute(cmd, args, cwd) {
  execSync([cmd, ...args].join(" "), {
    env: process.env,
    stdio: "inherit",
    cwd
  });
}

function joinPath(url, ...segments) {
  if (url) return segments.join("/");
  return path.join(...segments);
}

const directoryTree = {
  "package.json": ["package.json"],
  "bun.lock": ["bun.lock"],
  apps: {
    desktop: {
      "package.json": ["apps", "desktop", "package.json"],
      "bun.lock": ["apps", "desktop", "bun.lock"]
    }
  },
  scripts: {
    "package.json": ["scripts", "package.json"]
  },
  packages: {
    sodium: {
      "package.json": ["packages", "sodium", "package.json"],
      "bun.lock": ["packages", "sodium", "bun.lock"]
    },
    intl: {
      "package.json": ["packages", "intl", "package.json"],
      "bun.lock": ["packages", "intl", "bun.lock"]
    },
    crypto: {
      "package.json": ["packages", "crypto", "package.json"],
      "bun.lock": ["packages", "crypto", "bun.lock"]
    },
    ui: {
      "package.json": ["packages", "ui", "package.json"],
      "bun.lock": ["packages", "ui", "bun.lock"]
    },
    theme: {
      "package.json": ["packages", "theme", "package.json"],
      "bun.lock": ["packages", "theme", "bun.lock"]
    }
  }
};

async function createDirectoryTree(tree, dest) {
  if (!fsSync.existsSync(dest)) await fs.mkdir(dest, { recursive: true });

  for (const key in tree) {
    const value = tree[key];
    if (typeof value === "object" && Array.isArray(value)) {
      const src = joinPath(IS_ROOT_URL, ROOT_PATH, ...value);
      if (IS_ROOT_URL) {
        console.log("Downloading", src);
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to download ${src}`);
        await fs.writeFile(
          path.join(dest, path.basename(src)),
          Buffer.from(await response.arrayBuffer())
        );
      } else {
        await fs.copyFile(src, path.join(dest, path.basename(src)));
      }
    } else if (typeof value === "object") {
      await createDirectoryTree(value, path.join(dest, key));
    }
  }
}

const TEMP_FOLDER = await fs.mkdtemp(path.join(os.tmpdir(), "nn-"));

await createDirectoryTree(directoryTree, TEMP_FOLDER);

console.log("Created directory tree at", TEMP_FOLDER);

const lockfiles = [
  {
    name: "main",
    path: path.join(TEMP_FOLDER, "bun.lock"),
    ignoreDev: true
  },
  {
    name: "desktop",
    path: path.join(TEMP_FOLDER, "apps", "desktop", "bun.lock")
  },
  {
    name: "intl",
    path: path.join(TEMP_FOLDER, "packages", "intl", "bun.lock")
  },
  {
    name: "sodium",
    path: path.join(TEMP_FOLDER, "packages", "sodium", "bun.lock")
  },
  {
    name: "crypto",
    path: path.join(TEMP_FOLDER, "packages", "crypto", "bun.lock")
  },
  {
    name: "ui",
    path: path.join(TEMP_FOLDER, "packages", "ui", "bun.lock")
  },
  {
    name: "theme",
    path: path.join(TEMP_FOLDER, "packages", "theme", "bun.lock")
  }
];

process.chdir(TEMP_FOLDER);

let allSources = [];
for (const lockfile of lockfiles) {
  if (!fsSync.existsSync(lockfile.path)) {
    console.error("skipping. lockfile does not exist at", lockfile.path);
    continue;
  }

  console.log("generating yarn.lock for", lockfile.path);
  execute(
    "bun",
    ["install", "--yarn", "--ignore-scripts"],
    path.dirname(lockfile.path)
  );

  lockfile.path = lockfile.path.replace("bun.lock", "yarn.lock");

  await transformLockfile(lockfile.path);

  console.log("generating sources for", lockfile.path);

  const output = path.join(TEMP_FOLDER, `${lockfile.name}-sources.json`);
  execute(
    `flatpak-node-generator`,
    [
      lockfile.name === "desktop" ? "--electron-node-headers" : false,
      "yarn",
      lockfile.path,
      "-o",
      output
    ].filter(Boolean)
  );

  const sources = JSON.parse(await fs.readFile(output, "utf-8"));
  allSources = [...allSources, ...sources];

  await fs.rm(output, { force: true });
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
  path.join(__dirname, "..", "generated-sources.json"),
  JSON.stringify(allSources, undefined, 4)
);

console.log("done");

async function transformLockfile(lockfilePath) {
  const text = readFileSync(lockfilePath, "utf-8");
  const packages = await findPackages(["packages/*", "apps/*"], TEMP_FOLDER);
  packages.push(path.join(TEMP_FOLDER, "scripts"));

  writeFileSync(
    lockfilePath,
    text.replace(/link:(@notesnook\/[\w-]+)/gm, (match, packageName) => {
      let packagePath = findPackagePath(packageName, packages);
      const replacement = `file:${path.relative(
        path.dirname(lockfilePath),
        packagePath
      )}`;
      return replacement;
    })
  );
}
