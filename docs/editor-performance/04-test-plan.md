# 04 — Test plan

The governing principle: **document state is the invariant.** Every stage here changes only how the
document is *rendered*, never what it *contains*. So the highest-value test is not any single
assertion — it is a differential test proving that an optimized editor and a plain editor, given the
same operations, always hold the same document.

Existing test infrastructure: `packages/editor` uses **vitest** with **happy-dom** (`vitest.config.ts`),
plus `prosemirror-test-builder`. Note that happy-dom cannot validate layout, native selection, or
`content-visibility`; those need the real-browser harness in [`poc/`](poc/).

---

## 0. The highest-value test: differential fuzz

Already built and passing — `poc/proof2.html` → `window.differentialFuzz`. Productionize it into
`packages/editor/src/__tests__/`.

Two editors over an identical document, one optimized and one plain, receive the same pseudo-random
operation sequence. `doc.toJSON()` is compared after **every** operation, so a divergence is caught at
the operation that caused it rather than at the end.

Current coverage: 500 operations across 3 seeds, zero divergence.

**Extend before shipping Stage 3:**

- Operations must include every Notesnook block type: task lists, check lists, outline lists,
  callouts, tables, code blocks, math, images, attachments.
- Add operations that are structural rather than textual: split/join blocks, wrap/unwrap in
  blockquote, list indent/outdent, table row & column insert/delete, heading collapse.
- Add paste (of both HTML and plain text) and drag-drop.
- Interleave viewport moves aggressively — including jumping to a random position between every
  single edit, which is where placeholder/materialized transitions are most likely to break.
- Raise to ≥10,000 operations across ≥20 seeds in CI. Record the failing seed on divergence so
  failures are reproducible.

This one test subsumes most of the correctness matrix below.

---

## 1. Correctness — the original requirements

These are the behaviours the feature was asked for. All currently pass in `poc/poc.html`; they must
become permanent regression tests.

| Test | Assertion |
|---|---|
| Ctrl+A selects the whole document | `selection.from ≤ 1` and `selection.to ≥ doc.nodeSize - 3` |
| Copy All includes unrendered content | serialized clipboard text **and** HTML contain a sentinel planted at 90 % depth |
| Ctrl+A then type replaces everything | document reduces to exactly the typed content — no unrendered survivors |
| Ctrl+A then delete empties the document | `doc.textContent === ""` |
| Cut All | as copy, plus document is emptied |
| Undo/redo across unrendered regions | round-trips to the identical document |
| Edit applied to an unrendered position | applies to state; region stays unrendered |
| Scrolling materializes real content | sentinel appears in DOM, matches state |
| Save produces complete HTML | `editor.getHTML()` length matches the fully-rendered editor **byte for byte** |

That last one deserves emphasis: a bug here silently truncates users' notes on save. It should be
tested at every size tier and treated as a release blocker.

---

## 2. The `update()` trap — Stage 3

`prosemirror-view:1561` means a placeholder node view lacking a custom `update` is destroyed and
rebuilt on every keystroke, making things *slower*. This is invisible to correctness tests.

**Test:** instrument the placeholder factory with a construction counter. Type 100 characters into a
rendered block of a document with 1000 placeholders. Assert placeholder constructions **≈ 0**, not
merely "the document is still correct."

---

## 3. Performance regression tests

Run in real Chrome via the `poc/` harness, not happy-dom. Assert on **ratios against a plain-render
baseline**, never absolute milliseconds — absolute numbers vary by machine and will make CI flaky.

| Metric | Gate |
|---|---|
| Mount time, 2000-block note | ≥ 3× faster than baseline |
| Forced layout, 3000-block note | ≥ 3× faster than baseline |
| Typing p95, 3000-block note | ≥ 2× faster than baseline |
| DOM node count (Stage 3 only) | ≥ 10× fewer at 2000 blocks |
| Placeholder reconstructions while typing | ≈ 0 |

Baselines from this study, for reference — `results-2.json` and `results-4.json`:
mount 37.8 → 3.6 ms at 4000 blocks (10.5×); DOM 14,414 → 423 (34.1×); layout 6.4 → 1.1 ms with
`content-visibility` (5.8×).

**Stage 0 needs its own gate**, since virtualization ratios will not detect a regression there:
measure typing p95 on a 4000-block note with all extensions enabled, and assert it does not scale with
document size. That is the actual user complaint.

---

## 4. Cross-browser and cross-platform — gating for Stage 1

The one significant open question in the otherwise-lowest-risk stage. Run `poc/proof4.html` on each:

| Platform | Why it matters |
|---|---|
| **iOS WKWebView** | `apps/mobile` on iOS. WebKit containment support is newest here — **highest risk** |
| **Android System WebView** | `apps/mobile` on Android; Chromium-based, expected to match |
| Desktop Safari | web app |
| Firefox | web app |
| Chrome/Edge | verified ✅ |

For each, assert: layout speedup ≥ 2×; `window.find()` still finds off-screen content; caret
coordinates accurate; no visual artifacts while scrolling.

---

## 5. Manual / exploratory — cannot be automated meaningfully

Against a **real** large Notesnook note, not a synthetic one.

**Scrolling:** fast flings, scrollbar drags to arbitrary positions, jump to end and back, scroll
during active typing. Watch for scrollbar jump, blank regions, and drift.

**Caret and selection:** hold ArrowDown from top to bottom through placeholder boundaries; shift-select
across a placeholder boundary; drag-select across many screens; Home/End/PageUp/PageDown; click
directly on a placeholder.

**IME and mobile input:** compose CJK text near a placeholder boundary; autocorrect and predictive
text on iOS and Android; the software-keyboard show/hide reflow; text selection handles and the
magnifier.

**Feature interaction:** search-and-replace across unrendered regions; heading collapse spanning a
placeholder boundary; TOC navigation to an unrendered heading; table column resize near a boundary;
drag-drop a list item across one; check a task item in an unrendered list.

**Print / export:** print a large note and verify **every** page is present (Stage 3, caveat 2); export
to PDF and Markdown.

---

## 6. Test document corpus

Build once, reuse across every stage. Store as fixtures.

| Fixture | Purpose |
|---|---|
| 50 blocks | control — must be unaffected by all optimizations |
| 500 / 2000 / 5000 blocks, mixed content | the main tiers |
| 1000-item task list | worst case for React node views (~1001 roots today) |
| 100 code blocks × 200 lines | worst case for Prism highlighting |
| 50 large tables | worst case for the highest-risk node type |
| Deeply nested lists, 10 levels | structural edge case |
| A real user note ≥ 1 MB | the ground truth. **Re-run the whole harness against this before committing to Stage 3** |

Note the synthetic-corpus limitation honestly: the POC's documents lack React node views, KaTeX, and
attachments, so its absolute timings understate real cost. Ratios are the transferable result.

---

## 7. Recommended sequencing

1. Build the fixture corpus and productionize the differential fuzz **first** — it is the safety net
   every subsequent change relies on.
2. Add the Stage 0 typing-latency gate, then land Stage 0. Measure against a real note; this may end
   the project.
3. Cross-browser-verify Stage 1, then land it behind a size threshold.
4. Re-measure. Stop here unless the numbers still fall short.
5. Stage 2, then re-measure again.
6. Stage 3 only if justified — behind a feature flag, with the full manual matrix and an
   accessibility pass (caveat 6) before any user sees it.
