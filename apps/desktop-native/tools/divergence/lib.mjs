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

// Compares apps/desktop-native/src/app with apps/web/src file for file.
// Imports are taken out before comparing, so a pair that differs only in
// what it imports (and from where) counts as identical.

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];
// pending: a file that still drifts from web for no lasting reason, allowed
// for now so the check can gate new drift; its entry goes once it is aligned.
export const CATEGORIES = [
  "platform",
  "native-editor",
  "desktop-only",
  "pending"
];
// The pending backlog may only shrink: lower this as files are aligned, never
// raise it. An allowlist with more pending entries is rejected.
export const MAX_PENDING = 17;
// Tests are not app code: web keeps its own under __tests__/__e2e__.
const SKIPPED = /\.(test|spec)\.[cm]?[jt]sx?$|\.d\.ts$/;
const MODULE = '"<module>"';

/** Lists the code files under `root`, as `/`-separated paths relative to it. */
export function listCodeFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
      } else if (
        CODE_EXTENSIONS.includes(path.extname(entry.name)) &&
        !SKIPPED.test(entry.name)
      ) {
        out.push(path.relative(root, full).split(path.sep).join("/"));
      }
    }
  };
  walk(root);
  return out.sort();
}

const stem = (file) => file.slice(0, file.length - path.extname(file).length);

/**
 * Pairs each desktop file with the web file at the same relative path. The
 * extension may differ (`.ts` against `.tsx`), and `x` pairs with `x/index`
 * (and the other way round) when there is no exact match.
 */
export function pairFiles(desktopFiles, webFiles) {
  const webByStem = new Map();
  for (const file of webFiles) {
    const key = stem(file);
    if (!webByStem.has(key)) webByStem.set(key, file);
  }
  const usedWeb = new Set();
  const pairs = [];
  const desktopOnly = [];
  for (const file of desktopFiles) {
    const key = stem(file);
    const candidates = [key, `${key}/index`];
    if (key.endsWith("/index")) candidates.push(key.slice(0, -"/index".length));
    const match = candidates
      .map((candidate) => webByStem.get(candidate))
      .find((web) => web && !usedWeb.has(web));
    if (match) {
      usedWeb.add(match);
      pairs.push({ desktop: file, web: match });
    } else desktopOnly.push(file);
  }
  const webOnly = webFiles.filter((file) => !usedWeb.has(file));
  return { pairs, desktopOnly, webOnly };
}

function scriptKind(fileName) {
  switch (path.extname(fileName)) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

/**
 * Returns the source with its imports normalised: import declarations (and
 * `import x = require()`) are removed, and the module specifier of
 * `export … from`, `import()`, `import("…")` types and `require()` is
 * replaced by a placeholder.
 */
export function normaliseImports(source, fileName = "file.tsx") {
  const file = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(fileName)
  );
  const edits = [];
  const replace = (node) =>
    edits.push({ start: node.getStart(file), end: node.end, text: MODULE });
  const visit = (node) => {
    if (
      ts.isImportDeclaration(node) ||
      (ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference))
    ) {
      edits.push({ start: node.getStart(file), end: node.end, text: "" });
      return;
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      replace(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require")) &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      replace(node.arguments[0]);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    ) {
      replace(node.argument.literal);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  let out = source;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  return out;
}

/** The lines that are compared: trailing whitespace trimmed, blank lines dropped. */
export function comparableLines(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");
}

/**
 * Myers' diff of two arrays of lines. Returns the edit script as a list of
 * `{ op: " " | "-" | "+", line }`, `-` being lines only in `a`.
 */
export function diffLines(a, b) {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max + 1;
  let v = new Int32Array(2 * max + 3);
  const trace = [];
  let found = n === 0 && m === 0;
  for (let d = 0; d <= max && !found; d++) {
    // Only diagonals -d..d are read when walking back from round d.
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
  }
  if (n === 0 && m === 0) return [];
  // Walk the trace back from (n, m) to (0, 0).
  const script = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const vd = trace[d];
    const base = d + 1;
    const k = x - y;
    let prevK;
    if (d === 0) prevK = 0;
    else
      prevK =
        k === -d || (k !== d && vd[base + k - 1] < vd[base + k + 1])
          ? k + 1
          : k - 1;
    const prevX = d === 0 ? 0 : vd[base + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      script.push({ op: " ", line: a[x - 1] });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX) script.push({ op: "+", line: b[y - 1] });
      else script.push({ op: "-", line: a[x - 1] });
    }
    x = prevX;
    y = prevY;
  }
  return script.reverse();
}

/** Compares one desktop/web pair after normalising imports. */
export function comparePair(desktopSource, webSource, desktopName, webName) {
  const a = comparableLines(normaliseImports(webSource, webName));
  const b = comparableLines(normaliseImports(desktopSource, desktopName));
  const script = diffLines(a, b);
  let added = 0;
  let removed = 0;
  for (const step of script) {
    if (step.op === "+") added++;
    else if (step.op === "-") removed++;
  }
  return { added, removed, changed: added + removed, script };
}

/** Turns a glob (`*`, `**`, `?`) into a RegExp matching `/`-separated paths. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") {
          i++;
          re += "(?:.*/)?";
        } else re += ".*";
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

/**
 * Validates an allowlist (`{ entries: [{ path, category, reason }] }`) and
 * returns its entries with a matcher, or throws listing every problem.
 */
export function parseAllowlist(json) {
  const problems = [];
  const entries = Array.isArray(json?.entries) ? json.entries : null;
  if (!entries) throw new Error('allowlist: expected { "entries": [...] }');
  const parsed = entries.map((entry, index) => {
    const where = `allowlist entry ${index + 1}${
      entry?.path ? ` (${entry.path})` : ""
    }`;
    if (typeof entry?.path !== "string" || entry.path.trim() === "")
      problems.push(`${where}: "path" is missing`);
    if (!CATEGORIES.includes(entry?.category))
      problems.push(
        `${where}: "category" must be one of ${CATEGORIES.join(", ")}`
      );
    if (typeof entry?.reason !== "string" || entry.reason.trim().length < 10)
      problems.push(`${where}: "reason" must say why (10 characters or more)`);
    return {
      ...entry,
      matches: globToRegExp(String(entry?.path ?? ""))
    };
  });
  const pending = entries.filter((e) => e?.category === "pending").length;
  if (pending > MAX_PENDING)
    problems.push(
      `allowlist: ${pending} "pending" entries, at most ${MAX_PENDING}; align new drift with web instead of allowlisting it`
    );
  if (problems.length) throw new Error(problems.join("\n"));
  return parsed;
}

const read = (file) => fs.readFileSync(file, "utf8");

/**
 * What makes the CI check fail: every divergent or desktop-only file with no
 * allowlist entry. Empty when the tree is clean.
 */
export function checkFailures(report) {
  return [
    ...report.divergent
      .filter((d) => !d.allowed)
      .map((d) => `${d.desktop}: +${d.added} -${d.removed} lines vs web`),
    ...report.desktopOnly
      .filter((o) => !o.allowed)
      .map((o) => `${o.desktop}: no web counterpart`)
  ];
}

/** Builds the whole report. Paths in it are relative to the desktop app root. */
export function buildReport({ appSrc, webSrc, allowlist }) {
  const { pairs, desktopOnly, webOnly } = pairFiles(
    listCodeFiles(appSrc),
    listCodeFiles(webSrc)
  );
  const used = new Set();
  const allowedFor = (file) => {
    const entry = allowlist.find((candidate) => candidate.matches.test(file));
    if (entry) used.add(entry);
    return entry;
  };
  const describe = (entry) =>
    entry ? { category: entry.category, reason: entry.reason } : undefined;

  const identical = [];
  const divergent = [];
  for (const pair of pairs) {
    const result = comparePair(
      read(path.join(appSrc, pair.desktop)),
      read(path.join(webSrc, pair.web)),
      pair.desktop,
      pair.web
    );
    if (result.changed === 0) {
      identical.push(pair);
      continue;
    }
    divergent.push({
      ...pair,
      added: result.added,
      removed: result.removed,
      changed: result.changed,
      allowed: describe(allowedFor(pair.desktop))
    });
  }
  divergent.sort(
    (a, b) => b.changed - a.changed || a.desktop.localeCompare(b.desktop)
  );
  const only = desktopOnly.map((file) => ({
    desktop: file,
    lines: comparableLines(read(path.join(appSrc, file))).length,
    allowed: describe(allowedFor(file))
  }));
  // An entry is stale when it matches nothing that diverges any more.
  const stale = allowlist
    .filter((entry) => !used.has(entry))
    .map(({ path: p, category, reason }) => ({ path: p, category, reason }));

  const unexplained = divergent.filter((d) => !d.allowed);
  const sum = (items, key) => items.reduce((total, i) => total + i[key], 0);
  return {
    summary: {
      desktopFiles: pairs.length + desktopOnly.length,
      paired: pairs.length,
      identical: identical.length,
      divergent: divergent.length,
      divergentAllowed: divergent.length - unexplained.length,
      divergentUnexplained: unexplained.length,
      changedLines: sum(divergent, "changed"),
      unexplainedChangedLines: sum(unexplained, "changed"),
      desktopOnly: only.length,
      desktopOnlyAllowed: only.filter((o) => o.allowed).length,
      desktopOnlyUnexplained: only.filter((o) => !o.allowed).length,
      webOnly: webOnly.length,
      staleAllowlistEntries: stale.length
    },
    identical: identical.map((pair) => pair.desktop),
    divergent,
    desktopOnly: only,
    webOnly,
    stale
  };
}
