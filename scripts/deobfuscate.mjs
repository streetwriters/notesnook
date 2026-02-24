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

/**
 * Deobfuscate a minified JavaScript stack trace using source maps.
 *
 * Usage:
 *   node scripts/deobfuscate.mjs [options] [stack-trace-file]
 *
 *   If no file is given the script reads from stdin. The stack trace may
 *   contain literal spaces or URL-encoded "+" characters in place of spaces.
 *
 * Options:
 *   --base-url <url>   Base URL for fetching remote .map files.
 *                      Default: https://app.notesnook.com/assets/
 *   --local <dir>      Directory to resolve .map files from before fetching
 *                      remotely. Useful when you have a local build handy.
 *   --cache-dir <dir>  Where to cache downloaded source maps on disk.
 *                      Default: ~/.cache/notesnook/sourcemaps
 *   --no-cache         Skip the on-disk cache; always fetch fresh copies.
 *   --context <n>      Lines of original source context to show after each
 *                      resolved frame (default: 2, 0 to disable).
 *   --help             Print this help message.
 */

import https from "https";
import http from "http";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import { glob } from "fs/promises";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { URL } from "url";

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);

function parseArgs(argv) {
  const opts = {
    baseUrl: "https://app.notesnook.com/assets/",
    cacheDir: path.join(os.homedir(), ".cache", "notesnook", "sourcemaps"),
    localDir: null,
    noCache: false,
    context: 2,
    help: false,
    inputFile: null
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--no-cache") {
      opts.noCache = true;
    } else if (arg === "--base-url") {
      opts.baseUrl = argv[++i];
      if (!opts.baseUrl.endsWith("/")) opts.baseUrl += "/";
    } else if (arg === "--local") {
      opts.localDir = argv[++i];
    } else if (arg === "--cache-dir") {
      opts.cacheDir = argv[++i];
    } else if (arg === "--context" || arg === "-c") {
      opts.context = parseInt(argv[++i], 10);
    } else if (!arg.startsWith("-")) {
      opts.inputFile = arg;
    } else {
      die(`Unknown option: ${arg}`);
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function die(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

/**
 * Search the repo for a file whose path ends with the given suffix.
 * Tries progressively shorter trailing-path suffixes until a unique match
 * is found, then returns the absolute path.
 */
async function findInRepo(repoRoot, suffix) {
  // Normalise to forward slashes
  const parts = suffix.replace(/\\/g, "/").split("/").filter(Boolean);
  // Try from the longest suffix down to just the filename
  for (let take = parts.length; take >= 1; take--) {
    const pattern = "**/" + parts.slice(-take).join("/");
    const matches = [];
    try {
      for await (const f of glob(pattern, {
        cwd: repoRoot,
        exclude: (n) => n === "node_modules" || n === ".git"
      })) {
        matches.push(path.join(repoRoot, f));
      }
    } catch {
      continue;
    }
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      // If there are several, prefer the one with the most suffix components in common
      matches.sort(
        (a, b) =>
          b.replace(/\\/g, "/").split("/").length -
          a.replace(/\\/g, "/").split("/").length
      );
      return matches[0];
    }
  }
  return null;
}

// Cache to avoid re-searching the same suffix
const repoSearchCache = new Map();

async function resolveSourcePathAsync(source, mapUrl, repoRoot) {
  if (!repoRoot) return source;
  const cached = repoSearchCache.get(source);
  if (cached !== undefined) return cached;

  let pathname;
  try {
    pathname = new URL(source, mapUrl).pathname.replace(/^\//, "");
  } catch {
    repoSearchCache.set(source, source);
    return source;
  }

  // Try exact path first (and common dist→src substitutions)
  const candidates = [
    path.join(repoRoot, pathname),
    path.join(repoRoot, pathname.replace(/\/dist\/esm\//, "/src/")),
    path.join(repoRoot, pathname.replace(/\/dist\//, "/src/"))
  ];
  for (const c of candidates) {
    if (existsSync(c)) {
      repoSearchCache.set(source, c);
      return c;
    }
  }

  // Fall back: fuzzy search in the repo
  const found = await findInRepo(repoRoot, pathname);
  const result = found ?? path.join(repoRoot, pathname);
  repoSearchCache.set(source, result);
  return result;
}

/**
 * Walk up the directory tree from `startDir` looking for a `.git` folder.
 * Returns the repo root, or null if not found.
 */
function findRepoRoot(startDir) {
  let dir = startDir;
  while (true) {
    if (existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

function printHelp() {
  const script = path.relative(process.cwd(), fileURLToPath(import.meta.url));
  console.log(
    `
Usage: node ${script} [options] [stack-trace-file]

If no file is given the stack trace is read from stdin.
The trace may use "+" as a space (URL-encoded form).

Options:
  --base-url <url>   Base URL for remote .map files
                     (default: https://app.notesnook.com/assets/)
  --local <dir>      Look for .map files in this local directory first
  --cache-dir <dir>  On-disk cache for downloaded source maps
                     (default: ~/.cache/notesnook/sourcemaps)
  --no-cache         Disable on-disk caching
  --context <n>      Lines of source context per frame (default: 2, 0 to disable)
  --help             Show this help
  `.trim()
  );
}

// ---------------------------------------------------------------------------
// Stack frame parsing
//
// Handles frames like:
//   at XB (https://example.com/assets/app-HASH.js:136:27466)
//   at https://example.com/assets/app-HASH.js:12:345   (anonymous)
//   at+XB+(https://example.com/assets/app-HASH.js:136:27466)  (URL-encoded)
// ---------------------------------------------------------------------------

const FRAME_RE =
  /at\s+(?:async\s+)?(\S+)\s+\(?(https?:\/\/[^\s):]+):(\d+):(\d+)\)?|at\s+(?:async\s+)?(https?:\/\/[^\s):]+):(\d+):(\d+)/g;

function parseStackTrace(raw) {
  // Replace URL-encoded + with spaces so the regex works uniformly
  const text = raw.replace(/\+/g, " ");
  const lines = text.split(/\r?\n/);
  const frames = [];

  for (const line of lines) {
    FRAME_RE.lastIndex = 0;
    const m = FRAME_RE.exec(line);
    if (!m) {
      frames.push({ raw: line, parsed: false });
      continue;
    }

    if (m[2]) {
      // "at symbol (url:line:col)"
      frames.push({
        raw: line,
        parsed: true,
        symbol: m[1],
        url: m[2],
        line: parseInt(m[3], 10),
        col: parseInt(m[4], 10)
      });
    } else {
      // "at url:line:col"
      frames.push({
        raw: line,
        parsed: true,
        symbol: null,
        url: m[5],
        line: parseInt(m[6], 10),
        col: parseInt(m[7], 10)
      });
    }
  }

  return frames;
}

// ---------------------------------------------------------------------------
// Source map fetching / caching
// ---------------------------------------------------------------------------

function fetchRemote(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https://") ? https : http;
    client
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return fetchRemote(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      })
      .on("error", reject);
  });
}

async function loadSourceMap(filename, opts) {
  // 1. Try local directory first
  if (opts.localDir) {
    const local = path.join(opts.localDir, filename);
    if (existsSync(local)) {
      process.stderr.write(`Using local map: ${local}\n`);
      return readFileSync(local, "utf8");
    }
  }

  // 2. Try on-disk cache
  if (!opts.noCache) {
    mkdirSync(opts.cacheDir, { recursive: true });
    const cached = path.join(opts.cacheDir, filename);
    if (existsSync(cached)) {
      process.stderr.write(`Cache hit: ${filename}\n`);
      return readFileSync(cached, "utf8");
    }
  }

  // 3. Fetch remotely
  const url = opts.baseUrl + filename;
  process.stderr.write(`Fetching ${url} ...\n`);
  const body = await fetchRemote(url);

  // 4. Persist to cache
  if (!opts.noCache) {
    const cached = path.join(opts.cacheDir, filename);
    writeFileSync(cached, body);
  }

  return body;
}

// ---------------------------------------------------------------------------
// Symbol demangling helpers
// ---------------------------------------------------------------------------

/**
 * For a dotted minified symbol like "Bs.exec", walk right-to-left through
 * each part and try to resolve each one via the source map by estimating the
 * column offset of that identifier in the minified source.
 *
 * V8 reports the column of the method name (rightmost part) in the call
 * expression, so we subtract (len(part) + 1) per step to back-track to each
 * preceding identifier.
 */
function tryDemangleDotted(consumer, generatedLine, generatedCol, symbol) {
  const parts = symbol.split(".");
  if (parts.length <= 1) return null;

  const resolved = [...parts];
  let col = generatedCol;

  for (let i = parts.length - 1; i >= 0; i--) {
    const pos = consumer.originalPositionFor({ line: generatedLine, column: col });
    if (pos.name) resolved[i] = pos.name;
    // Step back past this identifier and the dot that precedes it
    col -= parts[i].length + 1;
    if (col < 0) break;
  }

  const changed = resolved.some((p, i) => p !== parts[i]);
  return changed ? resolved.join(".") : null;
}

/**
 * Return lines of original source context around (line, col) using the
 * sourcesContent embedded in the source map.  Returns null if unavailable.
 */
function getSourceContext(consumer, source, line, col, contextLines) {
  if (contextLines <= 0) return null;
  let content;
  try {
    content = consumer.sourceContentFor(source, /*returnNullOnMissing=*/ true);
  } catch {
    return null;
  }
  if (!content) return null;

  const allLines = content.split("\n");
  const first = Math.max(0, line - 1 - contextLines);
  const last = Math.min(allLines.length - 1, line - 1 + contextLines);
  const numWidth = String(last + 1).length;

  return allLines.slice(first, last + 1).map((text, i) => ({
    lineNum: first + i + 1,
    text,
    isTarget: first + i + 1 === line,
    col: first + i + 1 === line ? col : null,
    numWidth
  }));
}

// ---------------------------------------------------------------------------
// Lazy source-map consumer loader (avoids hard dependency; works with both
// the CommonJS "source-map" package and the WASM "source-map-js" package).
// ---------------------------------------------------------------------------

let SourceMapConsumer;

async function getConsumer(rawJson) {
  if (!SourceMapConsumer) {
    try {
      const mod = await import("source-map");
      SourceMapConsumer = mod.SourceMapConsumer;
    } catch {
      try {
        const mod = await import("source-map-js");
        SourceMapConsumer = mod.SourceMapConsumer;
      } catch {
        die(
          'Neither "source-map" nor "source-map-js" is installed.\n' +
            "Run: npm install -g source-map   or   npm install -g source-map-js"
        );
      }
    }
  }
  return new SourceMapConsumer(JSON.parse(rawJson));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  // Read the raw stack trace
  let raw;
  if (opts.inputFile) {
    if (!existsSync(opts.inputFile)) die(`File not found: ${opts.inputFile}`);
    raw = readFileSync(opts.inputFile, "utf8");
  } else if (!process.stdin.isTTY) {
    raw = readFileSync("/dev/stdin", "utf8");
  } else {
    die("No input: provide a file argument or pipe a stack trace to stdin.");
  }

  const frames = parseStackTrace(raw);

  // Collect unique bundle filenames that need a source map
  const bundles = new Set(
    frames.filter((f) => f.parsed).map((f) => path.basename(f.url) + ".map")
  );

  // Load all needed source maps in parallel
  process.stderr.write("\n");
  // Determine the repo root once so we can produce clickable absolute paths.
  const repoRoot = findRepoRoot(process.cwd());

  const consumers = {}; // mapFile -> { consumer, mapUrl }
  await Promise.all(
    [...bundles].map(async (mapFile) => {
      try {
        const raw = await loadSourceMap(mapFile, opts);
        const mapUrl = opts.baseUrl + mapFile;
        consumers[mapFile] = { consumer: await getConsumer(raw), mapUrl };
      } catch (e) {
        process.stderr.write(
          `Warning: could not load ${mapFile}: ${e.message}\n`
        );
      }
    })
  );
  process.stderr.write("\n");

  // Resolve and print
  for (const frame of frames) {
    if (!frame.parsed) {
      console.log(frame.raw);
      continue;
    }

    const mapFile = path.basename(frame.url) + ".map";
    const entry = consumers[mapFile];

    if (!entry) {
      console.log(
        `    at ${frame.symbol ?? "<anonymous>"} (${frame.url}:${frame.line}:${
          frame.col
        })  [no source map]`
      );
      continue;
    }

    const { consumer, mapUrl } = entry;
    const pos = consumer.originalPositionFor({
      line: frame.line,
      column: frame.col
    });

    if (!pos.source) {
      // Could not map — fall back to minified info
      console.log(
        `    at ${frame.symbol ?? "<anonymous>"} (${frame.url}:${frame.line}:${
          frame.col
        })  [unmapped]`
      );
      continue;
    }

    // Resolve the best available symbol name:
    //   1. name from the source map at this exact position
    //   2. dotted-symbol walk (e.g. "Bs.exec" → "SqliteWorker.exec")
    //   3. original minified symbol as fallback
    const minifiedSymbol = frame.symbol ?? "<anonymous>";
    const name =
      (minifiedSymbol.includes(".")
        ? tryDemangleDotted(consumer, frame.line, frame.col, minifiedSymbol)
        : null) ??
      pos.name ??
      minifiedSymbol;

    // Resolve to an absolute (clickable) path.
    const src = await resolveSourcePathAsync(pos.source, mapUrl, repoRoot);
    console.log(`    at ${name} (${src}:${pos.line}:${pos.column})`);

    // Source context
    const ctx = getSourceContext(consumer, pos.source, pos.line, pos.column, opts.context);
    if (ctx) {
      for (const l of ctx) {
        const gutter = l.isTarget ? ">" : " ";
        const num = String(l.lineNum).padStart(l.numWidth);
        console.log(`    ${gutter} ${num} | ${l.text}`);
      }
      console.log();
    }
  }

  // Clean up WASM consumers if applicable
  for (const { consumer: c } of Object.values(consumers)) {
    if (typeof c.destroy === "function") c.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
