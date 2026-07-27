# Large-note editor performance: feasibility study and design

**Status:** research complete, implementation not started
**Scope:** `packages/editor` (shared by `apps/web` and `apps/mobile` via `packages/editor-mobile`)
**Date:** 2026-07

---

## The question that was asked

> Can we add hidden paging to Tiptap/ProseMirror so all content is not rendered — like a
> virtualized list — while Ctrl+A, Copy All, etc. keep working?

## The short answer

**Yes. It is possible, and it is proven here — not argued from documentation.** ProseMirror will
happily hold a full document in state while rendering only a window of it to the DOM, and
select-all, copy-all, undo/redo, and off-screen editing all keep working correctly. Every claim in
these documents is backed by either a line of `prosemirror-view` source or a measurement from a real
Chrome run, both reproducible via [`poc/`](poc/).

**But the study also found that virtualization is probably not the change you should make first.**
Two measured findings reframe the problem:

1. **Virtualization does nothing for the "gets slower and slower while typing" symptom.** Per-keystroke
   cost from document-wide plugin work is *identical* with and without virtualization
   (1.5 ms median at 4000 blocks, both). Notesnook has at least six such document-wide passes per
   edit. See [01-feasibility-proof.md § 4](01-feasibility-proof.md#4-what-virtualization-does-not-fix).
2. **A far cheaper technique gets most of the win with none of the breakage.** CSS
   `content-visibility: auto` cut forced-layout cost 5.8× and typing p95 3.5× while keeping
   find-in-page, printing, the accessibility tree, `coordsAtPos`, and the clipboard fully intact.
   Nobody in the ProseMirror community had verified this works inside `contenteditable`; **we now
   have.** See [01-feasibility-proof.md § 5](01-feasibility-proof.md#5-the-cheaper-alternative-content-visibility-auto).

True DOM-removal virtualization is strictly more powerful (up to **34× fewer DOM nodes**) but it
breaks browser find-in-page — verified, not theorized — and requires you to build a document height
map, a `beforeprint` force-render, and a custom find UI yourself.

## Recommendation

A staged plan, cheapest and safest first. Each stage is independently shippable and independently
valuable; stop whenever the numbers are good enough.

| Stage | Change | Measured benefit | Risk | Breaks anything? |
|---|---|---|---|---|
| **0** | Fix document-wide per-transaction work | Removes the *actual* typing-degradation cause | Low | No |
| **1** | `content-visibility: auto` + `contain-intrinsic-size` | 5.8× layout, 4.9× mount, 3.5× typing p95 | Low | No |
| **2** | Lazy React node views (mount on viewport entry) | Removes ~1 React root per task item / image / code block | Medium | No |
| **3** | True virtualization (contentDOM-less placeholders) | Up to 34× fewer DOM nodes | **High** | **Yes** — find-in-page, printing |

Stage 3 should be treated as a contingency, not a goal. Do it only if Stages 0–2 leave you short,
and only behind a feature flag with a per-note size threshold.

## Documents

| Document | What's in it |
|---|---|
| [01-feasibility-proof.md](01-feasibility-proof.md) | The evidence. Source-level proof, 12 runtime assertions, 500-operation differential fuzz, scale measurements, and what breaks. |
| [02-design.md](02-design.md) | How each stage is implemented, with the Notesnook-specific constraints that rule certain designs out. |
| [03-caveats.md](03-caveats.md) | Everything that degrades or breaks, severity-ranked, with mitigations. |
| [04-test-plan.md](04-test-plan.md) | What must be tested, including the differential-fuzz harness that is the single highest-value test. |
| [05-per-transaction-work.md](05-per-transaction-work.md) | **Stage 0 in depth.** How to make per-keystroke cost independent of document size, offender by offender. |
| [poc/](poc/) | The runnable proof harness. `node run.mjs` etc. — drives real Chrome, no Playwright browsers needed. |

## Reproducing the proofs

Requires Google Chrome installed and Node 18+ (uses native `WebSocket` and `fetch`).

```bash
cd docs/editor-performance/poc

# one-time: build the ProseMirror bundle the harness loads
cp entry.js ../../../packages/editor/.poc-entry.js
../../../node_modules/.bin/esbuild ../../../packages/editor/.poc-entry.js \
  --bundle --format=iife --outfile=pm-bundle.js
rm ../../../packages/editor/.poc-entry.js

node run.mjs 600   # core virtualization proofs (12 assertions)
node run2.mjs      # differential fuzz + scale sweep + find-in-page breakage
node run3.mjs      # doc-wide plugin cost + HTML parse cost
node run4.mjs      # content-visibility inside contenteditable
node run5.mjs      # structural sharing + incremental algorithms (Stage 0)
```

Committed outputs from the run these documents cite are in `results-1.json` … `results-4.json`
(HeadlessChrome/150, Apple Silicon, macOS 25.5).

## A note on the numbers

The POC uses a synthetic document, not a real Notesnook note. Absolute milliseconds are therefore
**not** predictions of production behaviour — a real note carries React node views, Prism
highlighting, KaTeX, and attachment handling that the POC only crudely simulates. The *ratios*
between conditions are the meaningful result, and the correctness proofs are absolute regardless of
document shape. Before committing to Stage 3, re-run the harness against a real exported note.
