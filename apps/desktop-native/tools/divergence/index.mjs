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

// Reports how far apps/desktop-native/src/app has drifted from apps/web/src.
// A report by default: it exits 0 whatever it finds (1 only for a broken
// allowlist or bad arguments). With --check (npm run check:divergence, run in
// CI) it is a gate: it exits 1 when a file diverges or has no web counterpart
// and is not on the allowlist.
//
//   npm run report:divergence                   text report
//   npm run report:divergence -- --json         the same as JSON
//   npm run report:divergence -- --show <path>  the diff of one pair
//
// Other options: --app-src, --web-src, --allowlist <file>.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReport,
  checkFailures,
  comparePair,
  listCodeFiles,
  pairFiles,
  parseAllowlist
} from "./lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "../..");
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const appSrc = path.resolve(
  option("--app-src") ?? path.join(appDir, "src/app")
);
const webSrc = path.resolve(
  option("--web-src") ?? path.join(appDir, "../web/src")
);
const allowlistPath = path.resolve(
  option("--allowlist") ?? path.join(here, "allowlist.json")
);

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (const dir of [appSrc, webSrc])
  if (!fs.existsSync(dir)) fail(`divergence: ${dir} does not exist`);

let allowlist;
try {
  allowlist = parseAllowlist(
    JSON.parse(fs.readFileSync(allowlistPath, "utf8"))
  );
} catch (error) {
  fail(`divergence: ${allowlistPath}\n${error.message}`);
}

const show = option("--show");
if (show) {
  const rel = show.replace(/^(\.\/)?(src\/app\/)?/, "");
  const { pairs } = pairFiles(listCodeFiles(appSrc), listCodeFiles(webSrc));
  const pair = pairs.find((p) => p.desktop === rel);
  if (!pair) fail(`divergence: ${rel} has no web counterpart`);
  const result = comparePair(
    fs.readFileSync(path.join(appSrc, pair.desktop), "utf8"),
    fs.readFileSync(path.join(webSrc, pair.web), "utf8"),
    pair.desktop,
    pair.web
  );
  console.log(`--- web/src/${pair.web}`);
  console.log(`+++ desktop-native/src/app/${pair.desktop}`);
  console.log(`(imports removed, blank lines ignored)`);
  for (const step of result.script)
    if (step.op !== " ") console.log(`${step.op}${step.line}`);
  console.log(`\n+${result.added} -${result.removed}`);
  process.exit(0);
}

const report = buildReport({ appSrc, webSrc, allowlist });

if (args.includes("--check")) {
  const failures = checkFailures(report);
  if (failures.length === 0) {
    console.log(
      `divergence: ok (${report.summary.identical} identical, ${
        report.summary.divergentAllowed + report.summary.desktopOnlyAllowed
      } allowlisted)`
    );
    process.exit(0);
  }
  console.error(
    `divergence: ${failures.length} file(s) in src/app differ from apps/web/src beyond imports and are not allowlisted:`
  );
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(
    "Align each with web (npm run report:divergence -- --show <path> shows the diff) or add it to tools/divergence/allowlist.json with a category and reason."
  );
  process.exit(1);
}

if (args.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const s = report.summary;
const out = [];
const line = (text = "") => out.push(text);
const pad = (value, width) => String(value).padStart(width);

line("Divergence of apps/desktop-native/src/app from apps/web/src");
line("(imports removed before comparing; blank lines ignored)");
line();
line(`Desktop code files      ${pad(s.desktopFiles, 6)}`);
line(`  paired with web       ${pad(s.paired, 6)}`);
line(`    identical           ${pad(s.identical, 6)}`);
line(
  `    divergent           ${pad(s.divergent, 6)}  (${
    s.divergentAllowed
  } allowlisted, ${s.divergentUnexplained} unexplained)`
);
line(
  `  desktop only          ${pad(s.desktopOnly, 6)}  (${
    s.desktopOnlyAllowed
  } allowlisted, ${s.desktopOnlyUnexplained} unexplained)`
);
line(`Web files with no pair  ${pad(s.webOnly, 6)}`);
line(
  `Changed lines           ${pad(s.changedLines, 6)}  (${
    s.unexplainedChangedLines
  } unexplained)`
);

const table = (title, rows) => {
  line();
  line(`${title} (${rows.length})`);
  for (const row of rows) line(`  ${row}`);
};

table(
  "Unexplained divergences: changed lines (+desktop -web)",
  report.divergent
    .filter((d) => !d.allowed)
    .map(
      (d) =>
        `${pad(d.changed, 5)}  +${d.added} -${d.removed}  ${d.desktop}${
          d.web === d.desktop ? "" : `  (web: ${d.web})`
        }`
    )
);
table(
  "Allowlisted divergences",
  report.divergent
    .filter((d) => d.allowed)
    .map(
      (d) =>
        `${pad(d.changed, 5)}  +${d.added} -${d.removed}  ${d.desktop}  [${
          d.allowed.category
        }] ${d.allowed.reason}`
    )
);
table(
  "Desktop-only files, unexplained: lines",
  report.desktopOnly
    .filter((o) => !o.allowed)
    .map((o) => `${pad(o.lines, 5)}  ${o.desktop}`)
);
table(
  "Desktop-only files, allowlisted",
  report.desktopOnly
    .filter((o) => o.allowed)
    .map(
      (o) =>
        `${pad(o.lines, 5)}  ${o.desktop}  [${o.allowed.category}] ${
          o.allowed.reason
        }`
    )
);
table("Web files with no desktop counterpart", report.webOnly);
if (report.stale.length)
  table(
    "Allowlist entries that match nothing divergent (remove them)",
    report.stale.map((e) => `${e.path}  [${e.category}]`)
  );

console.log(out.join("\n"));
