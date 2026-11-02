/**
 * Starts a new docs version.
 *
 *     npm run version -- 3.4
 *
 * Nothing is copied. The current docs simply become the newest archived version
 * — they are shared with the root until a page actually changes, at which point
 * `npm run fork` records the old text for that one page.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HELP = dirname(dirname(fileURLToPath(import.meta.url)));
const versionsPath = join(HELP, ".vitepress", "versions.mjs");

const next = process.argv[2];
if (!next || !/^\d+\.\d+$/.test(next)) {
  console.error("Usage: npm run version -- <version>   (e.g. 3.4)");
  process.exit(1);
}

const { LATEST, ARCHIVED } = await import(
  pathToFileURL(versionsPath).href + `?t=${Date.now()}`
);

if (next === LATEST || ARCHIVED.includes(next)) {
  console.error(`v${next} already exists.`);
  process.exit(1);
}

const overridesDir = join(HELP, "contents", "_versions", LATEST);
if (!existsSync(overridesDir)) {
  mkdirSync(overridesDir, { recursive: true });
  writeFileSync(
    join(overridesDir, "_excluded.txt"),
    [
      `# Pages that do not exist in v${LATEST}.`,
      "# One page path per line, relative to contents/, e.g.:",
      "#   organizing-notes/some-new-feature.md",
      ""
    ].join("\n")
  );
}

writeFileSync(
  versionsPath,
  readFileSync(versionsPath, "utf8")
    .replace(/export const LATEST = "[^"]+";/, `export const LATEST = "${next}";`)
    .replace(
      /export const ARCHIVED = \[[^\]]*\];/,
      `export const ARCHIVED = [${[LATEST, ...ARCHIVED].map((v) => `"${v}"`).join(", ")}];`
    )
    .replace(/npm run version -- [\d.]+/, `npm run version -- ${bumpMinor(next)}`)
    .replace(/npm run fork -- [\d.]+ /, `npm run fork -- ${next} `)
);

function bumpMinor(v) {
  const [major, minor] = v.split(".").map(Number);
  return `${major}.${minor + 1}`;
}

console.log(
  [
    `The site root now describes v${next}. v${LATEST} is archived at /v${LATEST}/.`,
    "",
    "No pages were copied — every page is shared until it changes. Before you",
    `edit a page in a way that does not apply to v${LATEST}, run:`,
    "",
    `    npm run fork -- ${LATEST} <page>`,
    ""
  ].join("\n")
);
