import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, filter, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "build") continue;
      walk(full, filter, out);
    } else if (filter(full)) out.push(full);
  }
  return out;
}

const sources = walk(path.join(root, "src"), (f) => /\.(ts|tsx)$/.test(f))
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

const specs = [
  ...walk(path.join(root, "desktop/e2e"), (f) => f.endsWith(".ts")),
  path.join(root, "tools/parity/scenarios.mjs")
];

const patterns = [
  /getByTestId\(\s*["'`]([^"'`$]+)["'`]/g,
  /query\(\s*["']testID["']\s*,\s*["'`]([^"'`$]+)["'`]/g,
  /\bclick:\s*["']([^"']+)["']/g,
  /\brightClick:\s*["']([^"']+)["']/g,
  /\bid:\s*["']([^"']+)["']/g,
  /\b(?:clickId|typeInto|expectDialog|expectClosed|closeWithEscape|closeWithBackdrop)\(\s*app!?\s*,\s*["']([^"']+)["']/g,
  /\bcount\(\s*app!?\s*,\s*["']([^"']+)["']/g,
  /\bexpectSettings\(\s*app\s*,\s*\[([^\]]*)\]/g
];

const prefixed = [
  "menu-button-",
  "setting-",
  "tab-",
  "toolbar-node-",
  "toolbar-preset-",
  "checkout-"
];

const templates = [
  ...sources.matchAll(/test[Ii][Dd]=\{`([^`]+)`\}/g),
  ...sources.matchAll(/test[Ii][Dd]:[^`\n]*`([^`]+)`/g)
].map(
  (match) =>
    new RegExp(
      `^${match[1]
        .replace(/[.*+?^()|[\]\\]/g, "\\$&")
        .replace(/\$\{[^}]*\}/g, ".+")}$`
    )
);

const literal = (value) =>
  sources.includes(`"${value}"`) ||
  sources.includes(`'${value}'`) ||
  sources.includes(`\`${value}\``);

function exists(id) {
  if (literal(id)) return true;
  if (templates.some((template) => template.test(id))) return true;
  if (sources.includes(`testID="${id}"`)) return true;
  for (const prefix of prefixed) {
    if (!id.startsWith(prefix)) continue;
    let rest = id.slice(prefix.length);
    rest = rest.replace(/-(button|toggle)-\d+$/, "");
    if (prefix === "setting-" && sources.includes("`setting-${item.key}"))
      return literal(rest) || sources.includes(`key: "${rest}"`);
    if (prefix === "menu-button-" || prefix === "tab-")
      return (
        literal(rest) ||
        sources.includes(`key: "${rest}"`) ||
        sources.includes(`id: "${rest}"`)
      );
    if (prefix === "toolbar-node-" || prefix === "toolbar-preset-")
      return sources.includes(`\`${prefix}$`) || literal(rest);
    return sources.includes(`\`${prefix}`);
  }
  if (id.endsWith("-backdrop")) return sources.includes("-backdrop`");
  return false;
}

const ignore = new Set(["app"]);
const missing = new Map();
let checked = 0;

for (const file of specs) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const ids = pattern.source.startsWith("\\bexpectSettings")
        ? [...match[1].matchAll(/["']([^"']+)["']/g)].map(
            (m) => `setting-${m[1]}`
          )
        : [match[1]];
      for (const id of ids) {
        if (ignore.has(id)) continue;
        checked++;
        if (!exists(id)) {
          const key = `${id}`;
          missing.set(key, [...(missing.get(key) ?? []), path.basename(file)]);
        }
      }
    }
  }
}

if (missing.size) {
  console.error(`missing ${missing.size} of ${checked} referenced test ids:`);
  for (const [id, files] of missing)
    console.error(`  ${id}  (${[...new Set(files)].join(", ")})`);
  process.exit(1);
}
console.log(`all ${checked} referenced test ids exist`);
