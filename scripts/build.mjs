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
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_WATCH = process.argv.includes("--watch");
const TSC =
  process.platform === "win32"
    ? path.join(__dirname, "..", "node_modules", ".bin", "tsc.cmd")
    : path.join(__dirname, "..", "node_modules", ".bin", "tsc");

const esmPackageJson = {
  type: "module"
};

await Promise.all([
  cmd(
    TSC,
    "--noCheck",
    "--declaration",
    "false",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--outDir",
    "dist/cjs",
    IS_WATCH ? "--watch" : ""
  ),
  cmd(
    TSC,
    "--noCheck",
    "--declaration",
    "false",
    "--module",
    "esnext",
    "--moduleResolution",
    "Bundler",
    "--outDir",
    "dist/esm",
    IS_WATCH ? "--watch" : ""
  ),
  cmd(
    TSC,
    "--emitDeclarationOnly",
    "--outDir",
    "dist/types",
    IS_WATCH ? "--watch" : ""
  ),
  fs
    .mkdir("dist/esm", { recursive: true })
    .then(() =>
      fs.writeFile(
        "dist/esm/package.json",
        JSON.stringify(esmPackageJson, null, 2)
      )
    )
]);

function cmd(...command) {
  let p = spawn(command[0], command.slice(1), { shell: true });
  return new Promise((resolveFunc) => {
    p.stdout.on("data", (x) => {
      process.stdout.write(x.toString());
    });
    p.stderr.on("data", (x) => {
      process.stderr.write(x.toString());
    });
    p.on("exit", (code) => {
      console.log(command.join(" "), "exited with code", code);
      resolveFunc(code);
    });
  });
}
