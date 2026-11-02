/**
 * Guards against stale generated inputs.
 *
 * Two packages feed the docs and both are consumed as *built* output:
 *
 *   @notesnook/intl    -> the `{{key}}` labels resolved at build time
 *   @notesnook/common  -> the keybinding registry keyboard-shortcuts.md is generated from
 *
 * Edit either package's source without rebuilding it and the site quietly keeps
 * rendering the previous version — the exact drift this setup exists to prevent.
 * (Not hypothetical: a keybinding fix was regenerated once against a stale build
 * and silently produced the old shortcut.)
 *
 * The check compares *content*, not timestamps: mtimes are rewritten by npm
 * install, git checkouts and CI caches, so they produce false alarms. Instead we
 * take a sample of values out of the source and confirm the build contains them.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HELP = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGES = join(HELP, "..", "..", "packages");

const problems = [];

/* ------------------------------------------------- @notesnook/common (keys) */

const kbSource = join(PACKAGES, "common", "src", "utils", "keybindings.ts");
const kbBuilt = join(PACKAGES, "common", "dist", "esm", "utils", "keybindings.js");

if (!existsSync(kbBuilt)) {
  problems.push(
    `@notesnook/common has not been built, and keyboard-shortcuts.md is generated from it.\n` +
      `  cd packages/common && npm run build`
  );
} else {
  const src = readFileSync(kbSource, "utf8");
  const built = readFileSync(kbBuilt, "utf8");
  const missing = [...src.matchAll(/keys:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((keys) => !built.includes(`"${keys}"`));
  if (missing.length)
    problems.push(
      `@notesnook/common is stale — these bindings exist in src but not in dist: ` +
        `${[...new Set(missing)].slice(0, 5).join(", ")}.\n` +
        `keyboard-shortcuts.md is generated from the build, so it would keep the old keys.\n` +
        `  cd packages/common && npm run build && (cd ../../docs/help && npm run document-keyboard-shortcuts)`
    );
}

/* --------------------------------------------------- @notesnook/intl (text) */

const intlSource = join(PACKAGES, "intl", "src", "strings.ts");
const catalogue = join(PACKAGES, "intl", "dist", "locales", "$en.json");

if (!existsSync(catalogue)) {
  problems.push(
    `@notesnook/intl has not been built, and the docs resolve UI labels from it.\n` +
      `  cd packages/intl && npm install && npm run build`
  );
} else {
  const src = readFileSync(intlSource, "utf8");
  const messages = JSON.parse(readFileSync(catalogue, "utf8")).messages;
  const known = new Set(
    Object.values(messages).flatMap((v) =>
      typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((p) => typeof p === "string") : []
    )
  );
  // Plain single-line `key: () => t`Some text`` entries, no interpolation.
  const sourceTexts = [...src.matchAll(/^\s*[a-zA-Z0-9_]+: \(\) =>\s*t`([^`${]+)`/gm)].map(
    (m) => m[1]
  );
  const missing = sourceTexts.filter((text) => !known.has(text));
  if (missing.length > sourceTexts.length * 0.02)
    problems.push(
      `@notesnook/intl is stale — ${missing.length} strings exist in strings.ts but not in the ` +
        `compiled catalogue (e.g. ${missing.slice(0, 3).map((s) => JSON.stringify(s)).join(", ")}).\n` +
        `The docs would render the previous wording.\n` +
        `  cd packages/intl && npm run build`
    );
}

if (problems.length) {
  console.error("\n" + problems.join("\n\n") + "\n");
  process.exit(1);
}

console.log("Generated inputs (intl, common) match their source.");
