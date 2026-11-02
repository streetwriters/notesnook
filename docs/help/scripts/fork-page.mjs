/**
 * Preserves a page's current text for an older version, before you change it.
 *
 *     npm run fork -- 3.3 organizing-notes/archive-notes
 *     npm run fork -- 3.3 app-lock.md
 *
 * Run this *before* editing the page at the root. It copies today's text into
 * `contents/_versions/3.3/<page>`, so v3.3 keeps describing the old behaviour
 * while the root moves on. Pages you never fork stay shared — there is exactly
 * one copy of them in the repo.
 *
 * For a page that did not exist in an older version, add its path to
 * `contents/_versions/<version>/_excluded.txt` instead.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HELP = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTENTS = join(HELP, "contents");

const [version, rawPage] = process.argv.slice(2);
if (!version || !rawPage) {
  console.error(
    "Usage: npm run fork -- <version> <page>\n" +
      "  e.g. npm run fork -- 3.3 organizing-notes/archive-notes"
  );
  process.exit(1);
}

const { ARCHIVED } = await import(
  pathToFileURL(join(HELP, ".vitepress", "versions.mjs")).href
);
if (!ARCHIVED.includes(version)) {
  console.error(
    `v${version} is not an archived version. Archived: ${
      ARCHIVED.length ? ARCHIVED.join(", ") : "(none yet)"
    }`
  );
  process.exit(1);
}

const page = rawPage.replace(/^\/+/, "").replace(/\.md$/, "") + ".md";
const source = join(CONTENTS, page);
if (!existsSync(source)) {
  console.error(`No such page: contents/${page}`);
  process.exit(1);
}

const dest = join(CONTENTS, "_versions", version, page);
if (existsSync(dest)) {
  console.error(
    `contents/${relative(CONTENTS, dest)} already exists — v${version} already has its own copy of this page.`
  );
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);

console.log(
  [
    `Forked contents/${page} → contents/${relative(CONTENTS, dest)}`,
    "",
    `v${version} now keeps this text. Edit contents/${page} freely — your changes`,
    "apply to the latest docs only."
  ].join("\n")
);
