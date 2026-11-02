/**
 * Composes the `/v<version>/` doc trees before VitePress runs.
 *
 * Only *differences* are stored in the repo. `contents/_versions/<version>/`
 * holds the pages whose content differs from the current docs, plus an optional
 * `_excluded.txt` listing pages that did not exist in that version. Everything
 * else is shared with the latest docs.
 *
 * For each archived version this writes a complete `contents/v<version>/` tree
 * (gitignored, regenerated on every build) by layering:
 *
 *     current docs  ←  newest version's overrides  ←  …  ←  this version's
 *
 * so a page forked once keeps applying to every older version until an older
 * fork supersedes it. It also generates `.vitepress/sidebars/generated.mjs`,
 * which the config imports.
 *
 * Run automatically by `predev` / `prebuild`.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const HELP = dirname(dirname(fileURLToPath(import.meta.url)));
const CONTENTS = join(HELP, "contents");
const OVERRIDES = join(CONTENTS, "_versions");
const SIDEBARS = join(HELP, ".vitepress", "sidebars");

const { LATEST, ARCHIVED } = await import(
  pathToFileURL(join(HELP, ".vitepress", "versions.mjs")).href
);
const { sidebar } = await import(
  pathToFileURL(join(HELP, ".vitepress", "sidebar.mjs")).href
);

const isGeneratedVersionDir = (name) => /^v\d+\.\d+$/.test(name);

/** Every page in the current docs, as paths relative to `contents/`. */
function currentPages(dir = CONTENTS, out = []) {
  for (const entry of readdirSync(dir)) {
    if (dir === CONTENTS && (entry === "public" || entry === "_versions")) continue;
    if (dir === CONTENTS && isGeneratedVersionDir(entry)) continue;
    if (entry === ".vitepress" || entry === "node_modules") continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) currentPages(p, out);
    else if (p.endsWith(".md")) out.push(relative(CONTENTS, p));
  }
  return out;
}

/** The overrides recorded for one version. */
function overridesFor(version) {
  const dir = join(OVERRIDES, version);
  const pages = new Map();
  const excluded = new Set();
  if (!existsSync(dir)) return { pages, excluded };

  const excludeFile = join(dir, "_excluded.txt");
  if (existsSync(excludeFile)) {
    for (const line of readFileSync(excludeFile, "utf8").split("\n")) {
      const page = line.trim();
      if (page && !page.startsWith("#")) excluded.add(page);
    }
  }

  (function walk(d) {
    for (const entry of readdirSync(d)) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".md")) pages.set(relative(dir, p), p);
    }
  })(dir);

  return { pages, excluded };
}

/* Internal page links must stay inside the version; asset links must not —
   images and fonts are shared across versions. */
const ASSET = /\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf|pdf|json|txt)$/i;
const scope = (href, version) =>
  ASSET.test(href) ? href : `/v${version}${href}`;

function scopeLinks(markdown, version) {
  const fm = markdown.match(/^---\n[\s\S]*?\n---\n/);
  const head = fm
    ? // Frontmatter carries links too — the home page's hero actions and
      // feature cards are `link:` values, not markdown links.
      fm[0].replace(
        /^(\s*(?:-\s+)?link:\s*)(["']?)(\/[^\s"']*)\2\s*$/gm,
        (_, prefix, quote, href) => `${prefix}${quote}${scope(href, version)}${quote}`
      )
    : "";
  const body = fm ? markdown.slice(fm[0].length) : markdown;
  return (
    head +
    body.replace(/\]\((\/[^)\s]*)\)/g, (match, href) =>
      ASSET.test(href) ? match : `](${scope(href, version)})`
    )
  );
}

/* ------------------------------------------------------------------ compose */

// Wipe previously generated trees so a removed version leaves nothing behind.
for (const entry of readdirSync(CONTENTS)) {
  if (isGeneratedVersionDir(entry)) rmSync(join(CONTENTS, entry), { recursive: true });
}

const shared = currentPages();
const summary = [];

for (const version of ARCHIVED) {
  // Layer overrides from the newest archived version down to this one.
  const layers = ARCHIVED.slice(0, ARCHIVED.indexOf(version) + 1).map(overridesFor);

  const resolved = new Map(); // page -> source file (or null = use current docs)
  for (const page of shared) resolved.set(page, null);
  for (const layer of layers) {
    for (const [page, file] of layer.pages) resolved.set(page, file);
    for (const page of layer.excluded) resolved.delete(page);
  }

  const outDir = join(CONTENTS, `v${version}`);
  let forked = 0;
  for (const [page, override] of resolved) {
    const dest = join(outDir, page);
    mkdirSync(dirname(dest), { recursive: true });
    const src = override ?? join(CONTENTS, page);
    writeFileSync(dest, scopeLinks(readFileSync(src, "utf8"), version));
    if (override) forked++;
  }

  summary.push(
    `  v${version}: ${resolved.size} pages, ${forked} version-specific, ${
      resolved.size - forked
    } shared`
  );
}

/* ----------------------------------------------------------------- sidebars */

/** The current sidebar, re-pointed at a version and stripped of missing pages. */
function sidebarFor(version) {
  const present = new Set(
    existsSync(join(CONTENTS, `v${version}`))
      ? (function walk(d, out = []) {
          for (const entry of readdirSync(d)) {
            const p = join(d, entry);
            if (statSync(p).isDirectory()) walk(p, out);
            else if (p.endsWith(".md"))
              out.push("/" + relative(join(CONTENTS, `v${version}`), p).replace(/(index)?\.md$/, "").replace(/\/$/, "/"));
          }
          return out;
        })(join(CONTENTS, `v${version}`))
      : []
  );

  const exists = (link) => present.has(link) || present.has(link.replace(/\/$/, "/"));

  const rewrite = (items) =>
    items
      .map((item) => {
        const next = { ...item };
        if (next.items) next.items = rewrite(next.items);
        if (next.link) {
          if (!exists(next.link)) return null;
          next.link = `/v${version}${next.link}`;
        }
        return next.items && !next.items.length && !next.link ? null : next;
      })
      .filter(Boolean);

  return rewrite(sidebar);
}

mkdirSync(SIDEBARS, { recursive: true });
writeFileSync(
  join(SIDEBARS, "generated.mjs"),
  [
    "// Generated by scripts/build-versions.mjs — do not edit, do not commit.",
    "export const archivedSidebars = {",
    ...ARCHIVED.map(
      (v) => `  "/v${v}/": ${JSON.stringify(sidebarFor(v), null, 2).replace(/\n/g, "\n  ")},`
    ),
    "};",
    ""
  ].join("\n")
);

console.log(
  ARCHIVED.length
    ? [`Composed ${ARCHIVED.length} archived version(s) (latest is v${LATEST}):`, ...summary].join(
        "\n"
      )
    : `No archived versions yet — the site serves v${LATEST} from the root.`
);
