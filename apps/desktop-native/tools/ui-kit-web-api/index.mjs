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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContract } from "./contract.mjs";
import { scan } from "./scan.mjs";
import { PLANNED_FIXES, SUBSET, UNSUPPORTED } from "./status.mjs";

const START = "<!-- generated:start -->";
const END = "<!-- generated:end -->";
const EXPORT_NAMES = { default: "Modal" };
const LIBRARY_ORDER = [
  "theme-ui",
  "react-virtuoso",
  "react-modal",
  "@notesnook/ui"
];

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
};
const webSrc = path.resolve(option("--web-src") ?? path.join(appDir, "../web/src"));
const docPath = path.resolve(
  option("--doc") ?? path.join(appDir, "docs/ui-kit-web-api.md")
);
const write = !args.includes("--check");
const hasPlan = (row) => row.note.startsWith("planned fix:");

function lookup(table, component, item) {
  return table[`${component}.${item}`] ?? table[`*.${item}`];
}

function splitKey(key) {
  const index = key.lastIndexOf(":");
  return [key.slice(0, index), key.slice(index + 1)];
}

function build() {
  const usage = scan(webSrc);
  const contract = loadContract(appDir);
  const rows = [];
  const used = new Set();

  const add = (library, component, kind, name, item, entry, found) => {
    used.add(`${component}.${item}`);
    const unsupported = lookup(UNSUPPORTED, component, item);
    const planned = lookup(PLANNED_FIXES, component, item);
    const subset = lookup(SUBSET, component, item);
    let status;
    let note = "";
    if (unsupported) {
      status = "MISSING";
      note = `used by apps/web but marked not supported: ${
        unsupported.reason ?? unsupported
      }`;
    } else if (found && !found.deprecated) {
      status = subset ? "subset" : "kept";
      note = subset ?? "";
    } else {
      status = "MISSING";
      if (planned) note = `planned fix: ${planned}`;
      else
        note = found
          ? "only a deprecated member of the contract has this name"
          : "not in the contract";
    }
    rows.push({
      library,
      component,
      kind,
      name,
      uses: entry.count,
      where: entry.where[0]?.replace(/:\d+$/, "") ?? "",
      status,
      note
    });
  };

  for (const key of [...usage.components.keys()].sort()) {
    const [library, component] = splitKey(key);
    const entry = usage.components.get(key);
    const props = contract.propsOf(component);
    if (!props) {
      add(library, component, "component", component, "component", {
        count: 1,
        where: []
      });
      continue;
    }
    for (const [name, propEntry] of [...entry.props].sort())
      add(
        library,
        component,
        "prop",
        name,
        name,
        propEntry,
        contract.member(props, name)
      );
    for (const [handler, members] of [...entry.events].sort()) {
      const event = contract.eventOf(props, handler);
      for (const [name, memberEntry] of [...members].sort())
        add(
          library,
          component,
          "event",
          `${handler} → ${name}`,
          `${handler}>${name}`,
          memberEntry,
          event && contract.member(event, name)
        );
    }
    const element = contract.refOf(props);
    for (const [name, refEntry] of [...entry.refs].sort())
      add(
        library,
        component,
        "ref",
        `ref.current.${name}`,
        `ref>${name}`,
        refEntry,
        element && contract.member(element, name)
      );
  }

  for (const key of [...usage.imports.keys()].sort()) {
    const [library, imported] = splitKey(key);
    const name = EXPORT_NAMES[imported] ?? imported;
    add(
      library,
      name,
      "export",
      name,
      "export",
      usage.imports.get(key),
      contract.has(name)
        ? { deprecated: contract.isDeprecated(name) }
        : undefined
    );
  }

  const styleType = contract.typeNamed("StyleProp");
  for (const [name, entry] of [...usage.style].sort())
    add(
      "theme-ui",
      "style",
      "style key",
      name,
      name,
      entry,
      contract.member(styleType, name)
    );

  for (const [id, reason] of Object.entries(UNSUPPORTED)) {
    if (used.has(id)) continue;
    const [component, ...rest] = id.split(".");
    const item = rest.join(".");
    const whole = item === "component" || item === "export";
    if (whole ? contract.has(component) : false) {
      console.error(`${id} is marked not supported but is in the contract`);
      process.exit(2);
    }
    rows.push({
      library: reason.library ?? "",
      component,
      kind: whole ? item : "prop",
      name: whole ? component : item,
      uses: 0,
      where: "",
      status: "not supported",
      note: reason.reason ?? reason
    });
  }

  const sxType = contract.typeNamed("SxProp");
  const sx = [...usage.sx]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, entry]) => ({
      name,
      uses: entry.count,
      where: entry.where[0]?.replace(/:\d+$/, "") ?? "",
      status: contract.member(sxType, name) ? "kept" : "not in the contract"
    }));

  return { files: usage.files, rows, sx };
}

function cell(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function render({ files, rows, sx }) {
  const count = (status) => rows.filter((row) => row.status === status).length;
  const out = [];
  const planned = rows.filter(hasPlan).length;
  out.push(
    `Scanned ${files} files in \`apps/web/src\`: ${rows.length} items, ` +
      `${count("kept")} kept, ${count("subset")} subset, ` +
      `${count("not supported")} not supported (none of them used), ` +
      `${count("MISSING")} missing (${planned} with a planned fix). ` +
      "A missing item fails the check."
  );
  const libraries = [
    ...LIBRARY_ORDER,
    ...new Set(rows.map((row) => row.library))
  ].filter((library, index, all) => all.indexOf(library) === index);
  for (const library of libraries) {
    const own = rows.filter((row) => row.library === library);
    if (!own.length) continue;
    out.push("", `### ${library || "other"}`, "");
    out.push("| Component | API | Kind | Uses | Status | Note |");
    out.push("|---|---|---|---:|---|---|");
    for (const row of own)
      out.push(
        `| ${cell(row.component)} | \`${cell(row.name)}\` | ${row.kind} | ${
          row.uses
        } | ${row.status} | ${cell(row.note)} |`
      );
  }
  const missing = sx.filter((row) => row.status !== "kept");
  out.push("", "### sx keys", "");
  out.push(
    `${sx.length} different keys are written in \`sx\` objects; ` +
      `${sx.length - missing.length} are in the contract. ` +
      "The rest are listed here and do not fail the check."
  );
  out.push("", "| Key | Uses | Example |", "|---|---:|---|");
  for (const row of missing)
    out.push(`| \`${cell(row.name)}\` | ${row.uses} | ${cell(row.where)} |`);
  return out.join("\n");
}

const result = build();
const failures = result.rows.filter((row) => row.status === "MISSING");

if (write) {
  const table = render(result);
  const existing = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, "utf8")
    : `# UI kit: the web API\n\n${START}\n${END}\n`;
  const start = existing.indexOf(START);
  const end = existing.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    console.error(`${docPath} needs the ${START} and ${END} markers`);
    process.exit(2);
  }
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  fs.writeFileSync(
    docPath,
    `${existing.slice(0, start + START.length)}\n\n${table}\n\n${existing.slice(
      end
    )}`
  );
}

const total = (status) =>
  result.rows.filter((row) => row.status === status).length;
console.log(
  `ui-kit web API: ${result.rows.length} items from ${result.files} files; ` +
    `${total("kept")} kept, ${total("subset")} subset, ` +
    `${failures.length} missing (${failures.filter(hasPlan).length} with a planned fix)`
);
for (const row of failures)
  console.error(
    `MISSING ${row.library} ${row.component} ${row.kind} ${row.name} ` +
      `(${row.uses} uses, e.g. ${row.where}): ${row.note}`
  );
process.exit(failures.length ? 1 : 0);
