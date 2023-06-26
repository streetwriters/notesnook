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

import path from "path";
import fs from "fs/promises";
import { watch } from "turbowatch";
import { execSync, spawn } from "child_process";

const sodiumNativePrebuildPath = path.join(
  `node_modules`,
  `@notesnook`,
  `crypto`,
  `node_modules`,
  `@notesnook`,
  `sodium`,
  `node_modules`,
  `sodium-native`,
  `prebuilds`
);
let isServerRunning = false;

async function main() {
  const { shutdown } = await watch({
    project: path.join(__dirname, ".."),
    cwd: path.join(__dirname, ".."),
    triggers: [
      {
        expression: [
          "allof",
          ["not", ["dirname", "node_modules"]],
          ["match", "*.ts", "basename"]
        ],
        name: "dev",
        // retry: { retries: 0 },
        onTeardown: async () => {
          await fs.rm("./build/", { force: true, recursive: true });
        },
        onChange: async ({ first }) => {
          if (first) {
            await fs.rm("./build/", { force: true, recursive: true });
          }

          await exec(`npm run bundle`);
          await exec(`npx tsc`);

          if (first) {
            await fs.cp(sodiumNativePrebuildPath, "build/prebuilds", {
              recursive: true,
              force: true
            });
          }

          if (!isServerRunning) {
            await spawnAndWaitUntil(
              ["npm", "run", "start:desktop"],
              path.join(__dirname, "..", "..", "web"),
              (data) => data.includes("Network: use --host to expose")
            );
            isServerRunning = true;
          }

          await exec(`npx electron ${path.join("build", "electron.js")}`);
        }
      }
    ]
  });

  // SIGINT is the signal sent when we press Ctrl+C
  process.once("SIGINT", () => {
    void shutdown();
  });
}

main();

function spawnAndWaitUntil(
  cmd: string[],
  cwd: string,
  predicate: (data: string) => boolean
) {
  return new Promise((resolve) => {
    const s = spawn(cmd[0], cmd.slice(1), {
      cwd,
      env: { ...process.env, NO_COLOR: "true" }
    });

    process.once("beforeExit", () => {
      s.kill(-1);
    });

    s.stdout.on("data", (data) => {
      if (predicate(data)) resolve(undefined); //
    });
  });
}

async function exec(cmd) {
  return execSync(cmd, {
    env: process.env,
    stdio: "inherit"
  });
}
