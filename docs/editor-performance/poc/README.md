# Proof-of-concept harness

Runnable evidence for the claims in [../01-feasibility-proof.md](../01-feasibility-proof.md). Every
number cited in those documents comes from here.

## How it works

Each `proofN.html` builds real ProseMirror editors in a page and exposes measurement functions on
`window`. Each `runN.mjs` serves that page, launches your installed Google Chrome in headless mode,
drives it over the Chrome DevTools Protocol, and prints JSON.

There is deliberately **no Playwright/Puppeteer dependency** — the driver is ~60 lines using Node 18+
native `fetch` and `WebSocket`, and it uses the Chrome you already have.

## Setup

```bash
cd docs/editor-performance/poc

# Build the ProseMirror bundle the pages load. It must be built from inside
# packages/editor so that Node resolves the pinned prosemirror-* versions.
cp entry.js ../../../packages/editor/.poc-entry.js
../../../node_modules/.bin/esbuild ../../../packages/editor/.poc-entry.js \
  --bundle --format=iife --outfile=pm-bundle.js
rm ../../../packages/editor/.poc-entry.js
```

`pm-bundle.js` is generated and intentionally not committed.

## Running

| Command | What it proves | Output |
|---|---|---|
| `node run.mjs 600` | 12 core assertions: Ctrl+A, Copy All, off-screen edit, undo, materialize-on-scroll | `results-1.json` |
| `node run2.mjs` | Differential fuzz, select-all-replace, scale sweep, find-in-page breakage | `results-2.json` |
| `node run3.mjs` | Doc-wide plugin cost (the "gets slower" cause), HTML parse cost | `results-3.json` |
| `node run4.mjs` | `content-visibility: auto` inside `contenteditable` | `results-4.json` |
| `node run5.mjs` | Structural sharing, changed-range walks, memoized serialization, incremental word count | `results-5.json` |

The committed `results-*.json` are from HeadlessChrome/150, Apple Silicon, macOS 25.5.

## What's in each file

- **`poc.html`** — three editors side by side: full render, page-wrapper virtualization, and
  per-top-level-block virtualization. Plants a sentinel string at 90 % document depth and asserts it
  is absent from the DOM but present in state, clipboard, and after scrolling.
- **`proof2.html`** — `differentialFuzz()` runs identical random edit sequences against a virtualized
  and a plain editor, comparing `doc.toJSON()` after every operation. This is the strongest
  correctness evidence and the basis for the recommended production test.
- **`proof3.html`** — isolates cost that virtualization does *not* fix: a plugin walking the whole
  document per transaction, measured with and without virtualization. Also times ProseMirror's HTML
  parser.
- **`proof5.html`** — the basis for [../05-per-transaction-work.md](../05-per-transaction-work.md).
  Measures how much of a document keeps reference identity after a keystroke (99.98 % at 4000
  blocks), how many nodes a step-map-bounded walk visits versus a full walk (4 versus 10,860), and
  validates memoized serialization and incremental word counting against ground truth.
- **`proof4.html`** — applies `content-visibility: auto` to a live `contenteditable` and measures
  forced layout, mount, and typing while checking that `window.find()`, the clipboard, `coordsAtPos`,
  and `domAtPos` round-trips still work.

## Known limitations

- **Synthetic documents.** No React node views, KaTeX, Prism highlighting, or attachments, so
  absolute timings understate real Notesnook cost. Ratios between conditions are the meaningful
  result. Re-run against a real exported note before acting on Stage 3.
- **Chromium only.** `run4.mjs` in particular needs re-running on WKWebView and Android WebView; see
  [../04-test-plan.md § 4](../04-test-plan.md).
- **`poc.html` assertion P8** reports `false` — a test artifact, not a defect. The benchmark types 50
  characters before comparing documents (`218955 + 50 = 219005`). Superseded by the fuzz test.
- The expensive code-block node view in `poc.html` is a stand-in for syntax highlighting; it is not a
  correct editable node view and exists only to make node-view construction cost measurable.
