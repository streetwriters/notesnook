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

// The apps/web switch-over proof (see lib.mjs and docs/web-on-kit-proof.md).
//
//   node tools/web-kit-proof/index.mjs switch          rewrite apps/web's imports
//   node tools/web-kit-proof/index.mjs report <ref>    diff size and every
//                                                      non-import change since <ref>
//
// A report only: exits 0 whatever it finds, 1 for bad arguments.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nonImportChanges, switchImports } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const web = path.join(root, "apps/web");
const [command, ref] = process.argv.slice(2);
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });

if (command === "switch") {
  let files = 0;
  let imports = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules") walk(p);
      } else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
        const r = switchImports(fs.readFileSync(p, "utf8"));
        if (!r.count) continue;
        fs.writeFileSync(p, r.code);
        files++;
        imports += r.count;
      }
    }
  };
  for (const dir of ["src", "__tests__", "__e2e__"])
    if (fs.existsSync(path.join(web, dir))) walk(path.join(web, dir));
  console.log(`rewrote ${imports} imports in ${files} files`);
} else if (command === "report" && ref) {
  console.log(git("diff", "--shortstat", ref, "--", ".").trim());
  const files = git("diff", "--name-only", ref, "--", ".").split("\n").filter(Boolean);
  let importOnly = 0;
  let changed = 0;
  for (const file of files) {
    const before = (() => {
      try {
        return git("show", `${ref}:${file}`);
      } catch {
        return "";
      }
    })();
    const abs = path.join(root, file);
    const after = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
    const lines = /\.(tsx?|jsx?|mjs)$/.test(file)
      ? nonImportChanges(before, after)
      : ["(not a source file)"];
    if (!lines.length) {
      importOnly++;
      continue;
    }
    changed++;
    console.log(`\n${file}`);
    for (const l of lines) console.log(`  ${l}`);
  }
  console.log(
    `\n${files.length} files changed: ${importOnly} import-only, ${changed} with other changes`
  );
} else {
  console.error("usage: index.mjs switch | report <git-ref>");
  process.exit(1);
}
