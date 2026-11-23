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

// Usage: node scripts/with-hermes.mjs [command args...]
//
// Makes sure the pinned Hermes engine is in the shared per-user cache (see
// hermes-cache.mjs), then runs the command with RN_GPUI_HERMES_BIN_ROOT set to
// that cache, so the CMake build reads the folder the download went to.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const hermes = path.dirname(
  require.resolve("@react-native-gpui/hermes/package.json")
);
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// The native editor (streetwriters/native-editor) is a Cargo git dependency.
// Its `host-quickjs` build script bundles the editor's JS engine with esbuild
// from the checkout's own node_modules, which Cargo never installs, so a fresh
// machine or CI fails there with "Cannot find module 'esbuild'". Install them
// once in Cargo's checkout of the pinned revision.
function prepareNativeEditor() {
  const metadata = spawnSync(
    "cargo",
    [
      "metadata",
      "--format-version",
      "1",
      "--manifest-path",
      path.join(appRoot, "desktop", "Cargo.toml")
    ],
    {
      encoding: "utf8",
      maxBuffer: 512 * 1024 * 1024,
      // cargo is a real executable everywhere, so no shell: the manifest path
      // may contain spaces.
      stdio: ["ignore", "pipe", "inherit"]
    }
  );
  if (metadata.status !== 0) process.exit(metadata.status ?? 1);
  const engine = JSON.parse(metadata.stdout).packages.find(
    (pkg) => pkg.name === "host-quickjs"
  );
  // A `[patch]` to a local native-editor clone builds from that clone, which
  // has its own node_modules.
  if (!engine || !engine.source || !engine.source.startsWith("git+")) return;
  const root = path.resolve(path.dirname(engine.manifest_path), "..", "..");
  if (fs.existsSync(path.join(root, "node_modules", "esbuild"))) return;
  console.log(`Installing the native editor's JS build dependencies in ${root}`);
  run("npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: root
  });
}

run(process.execPath, [path.join(hermes, "scripts/fetch-binaries.mjs")]);

const [command, ...args] = process.argv.slice(2);
if (command) {
  prepareNativeEditor();
  run(command, args);
}
