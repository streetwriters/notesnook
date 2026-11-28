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
//   node tools/web-kit-proof/index.mjs report <base> [<head>]
//        diff size and every non-import change from <base> to <head>
//        (default HEAD), both committed
//   node tools/web-kit-proof/index.mjs typecheck [--verbose] [--keep]
//        apps/web's type errors before and after the switch, on a scratch copy
//
// A report only: exits 0 whatever it finds, 1 for bad arguments.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nonImportChanges, switchImports } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const web = path.join(root, "apps/web");
const [command, ref, head = "HEAD"] = process.argv.slice(2);
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
  console.log(git("diff", "--shortstat", ref, head, "--", ".").trim());
  const files = git("diff", "--name-only", ref, head, "--", ".")
    .split("\n")
    .filter(Boolean);
  const show = (rev, file) => {
    try {
      return git("show", `${rev}:${file}`);
    } catch {
      return "";
    }
  };
  let importOnly = 0;
  let changed = 0;
  for (const file of files) {
    const before = show(ref, file);
    const after = show(head, file);
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
} else if (command === "typecheck") {
  // Type-checks apps/web, as it is (baseline) and with its imports switched
  // to the kit, in a scratch copy next to apps/web so relative paths hold.
  // `react` is mapped to apps/web's one copy of the types: apps/web has
  // @types/react 18 and packages/ui 19, and mixing them fails before any
  // change. Prints both error counts and the switched run's errors by code.
  const scratch = path.join(root, "apps/.web-kit-proof");
  const verbose = process.argv.includes("--verbose");
  const run = (switched) => {
    fs.rmSync(scratch, { recursive: true, force: true });
    fs.mkdirSync(scratch);
    for (const name of ["src", "__tests__", "__e2e__", "global.d.ts"]) {
      const from = path.join(web, name);
      if (fs.existsSync(from))
        fs.cpSync(from, path.join(scratch, name), { recursive: true });
    }
    fs.symlinkSync(path.join(web, "node_modules"), path.join(scratch, "node_modules"));
    if (switched) {
      const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) walk(p);
          else if (/\.(tsx?|jsx?|mjs)$/.test(e.name)) {
            const r = switchImports(fs.readFileSync(p, "utf8"));
            if (r.count) fs.writeFileSync(p, r.code);
          }
        }
      };
      for (const dir of ["src", "__tests__", "__e2e__"])
        if (fs.existsSync(path.join(scratch, dir))) walk(path.join(scratch, dir));
    }
    const config = JSON.parse(fs.readFileSync(path.join(web, "tsconfig.json"), "utf8"));
    config.compilerOptions.incremental = false;
    config.compilerOptions.paths = {
      ...config.compilerOptions.paths,
      react: ["./node_modules/@types/react"],
      "react/*": ["./node_modules/@types/react/*"],
      "react-dom": ["./node_modules/@types/react-dom"],
      "react-dom/*": ["./node_modules/@types/react-dom/*"]
    };
    fs.writeFileSync(path.join(scratch, "tsconfig.json"), JSON.stringify(config, null, 2));
    let out = "";
    try {
      out = execFileSync(
        path.join(root, "node_modules/.bin/tsc"),
        ["-p", scratch, "--pretty", "false"],
        { cwd: scratch, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "pipe"] }
      );
    } catch (e) {
      out = `${e.stdout || ""}${e.stderr || ""}`;
    }
    return out.split("\n").filter((l) => /error TS\d+/.test(l));
  };
  try {
    const only = process.argv.includes("--switched-only");
    const baseline = only ? [] : run(false);
    const switched = run(true);
    // An error is "new" when the baseline has fewer errors with the same
    // file and code: positions shift with the import rewrite, and tsc prints
    // the members of a long union in a different order from run to run.
    const key = (l) => `${l.split("(")[0]} ${/error (TS\d+)/.exec(l)[1]}`;
    const budget = new Map();
    for (const l of baseline) budget.set(key(l), (budget.get(key(l)) ?? 0) + 1);
    const fresh = switched.filter((l) => {
      const left = budget.get(key(l)) ?? 0;
      if (left > 0) budget.set(key(l), left - 1);
      return left === 0;
    });
    const files = new Set(fresh.map((l) => l.split("(")[0]));
    if (verbose) for (const l of fresh) console.log(l);
    if (process.argv.includes("--baseline")) for (const l of baseline) console.log(l);
    if (!only) console.log(`baseline errors: ${baseline.length}`);
    console.log(`switched errors: ${switched.length}`);
    if (!only) console.log(`new on the switch: ${fresh.length}, in ${files.size} files`);
  } finally {
    if (!process.argv.includes("--keep"))
      fs.rmSync(scratch, { recursive: true, force: true });
  }
} else {
  console.error("usage: index.mjs switch | typecheck [--verbose] [--keep] [--switched-only] | report <base> [<head>]");
  process.exit(1);
}
