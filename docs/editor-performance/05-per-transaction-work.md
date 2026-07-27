# 05 — Making per-transaction work O(1)

**Problem:** typing latency grows with note length because several subsystems do work proportional to
the whole document on every transaction.
**Goal:** make per-keystroke cost independent of document size.
**Status:** design only — no code changes made.

Measurements here come from `poc/proof5.html` (`node run5.mjs`, output in `poc/results-5.json`),
run in HeadlessChrome/150 on Apple Silicon.

---

## 1. What we are actually targeting

Strict O(1) is not achievable and is not the right goal: pasting 1,000 blocks must cost something
proportional to 1,000 blocks. The correct target is:

> **O(Δ)** — cost proportional to *what the transaction changed*, not to what the document contains.

For a keystroke, Δ = 1 text node, so O(Δ) *is* O(1) in practice. That is the target: **typing in a
50,000-word note costs the same as typing in a 50-word note.**

### Why debouncing is not a solution

Notesnook already debounces much of this work — statistics at 1000 ms, mobile save at 300 ms,
toolbar refresh at 200 ms. Debouncing changes *how often* an O(N) pass runs; it does not change its
cost. The consequences:

- The hitch still happens, just less often — which reads to users as periodic stutter rather than
  uniform sluggishness, and is arguably worse.
- It gets steadily worse with document size, exactly matching the reported "slower and slower".
- Debounced work lands *while the user is still typing*, because a 300 ms gap happens constantly in
  natural typing.

Debouncing is a useful complement to an O(Δ) algorithm. It is not a substitute for one.

---

## 2. Why O(Δ) is achievable: two guarantees ProseMirror gives us

Both are verified below, not assumed. Together they make almost every pass on our list convertible.

### Guarantee A — every transaction carries an exact description of what it changed

A `Transaction` holds `steps`, and `tr.mapping.maps` holds one `StepMap` per step. `StepMap.forEach`
yields precisely the ranges that changed, in both old and new coordinates. This is O(number of
steps) — typically 1 — and completely independent of document size.

**Measured** (`results-5.json` → `changedRangeCost`), comparing a full `doc.descendants()` walk
against a walk bounded by the step maps, timing only the analysis pass:

| Blocks | Full walk | Nodes visited | Changed-range walk | Nodes visited |
|---|---|---|---|---|
| 500 | 0.0125 ms | 1,360 | 0.0005 ms | **4** |
| 2,000 | 0.0455 ms | 5,430 | 0.0005 ms | **4** |
| 4,000 | 0.0755 ms | 10,860 | below timer resolution | **4** |

**Four nodes visited, regardless of whether the document has 500 or 4,000 blocks.** The full walk
grows linearly; the changed-range walk is flat. That is the O(Δ) property, demonstrated directly.

### Guarantee B — the document is a persistent data structure, so unchanged subtrees keep object identity

ProseMirror documents are immutable with structural sharing: an edit rebuilds only the spine from the
root to the changed node. Every untouched sibling subtree is the **same JavaScript object** in the new
document as in the old one.

**Measured** (`results-5.json` → `structuralSharing`), after typing one character into block 0:

| Blocks | Top-level children | Reference-identical afterwards | Retained |
|---|---|---|---|
| 500 | 500 | 499 | 99.80 % |
| 2,000 | 2,000 | 1,999 | 99.95 % |
| 4,000 | 4,000 | 3,999 | **99.98 %** |

This is powerful because it makes memoization trivially correct: **any pure function of a subtree can
be cached in a `WeakMap` keyed by the node object.** A cache hit means the subtree is provably
unchanged — not "probably", but by reference identity. `WeakMap` also means no eviction logic and no
leaks; entries disappear when old documents are garbage collected.

---

## 3. The three techniques

Everything in §4 is an application of one of these.

### Technique 1 — Bound the walk by the step maps

Replace `doc.descendants(...)` / `doc.forEach(...)` in a transaction handler with a walk over changed
ranges only:

```ts
function forEachChangedNode(tr: Transaction, doc: Node, f: (node: Node, pos: number) => void) {
  for (const map of tr.mapping.maps) {
    map.forEach((_oldStart, _oldEnd, newStart, newEnd) => {
      doc.nodesBetween(newStart, Math.min(newEnd, doc.content.size), f);
    });
  }
}
```

`packages/editor/src/utils/prosemirror.ts` already exports `getChangedNodes`,
`getExactChangedNodes`, `getDeletedNodes`, and `changedDescendants` — the code-block highlighter
already uses them correctly. **This capability exists in the codebase and is simply not used by the
expensive extensions.**

Deletions need care: a deleted node is not in the new document, so track it via the *old* coordinates
in the same `forEach` callback, which is what `getDeletedNodes` is for.

### Technique 2 — Memoize per-subtree results in a `WeakMap`

For any pure function of a node:

```ts
const cache = new WeakMap<Node, Result>();

function compute(node: Node): Result {
  const hit = cache.get(node);
  if (hit !== undefined) return hit;
  const value = expensiveComputation(node);
  cache.set(node, value);
  return value;
}
```

After a keystroke, 3,999 of 4,000 top-level blocks hit the cache. Correct by construction, because a
hit means reference identity.

### Technique 3 — Maintain running aggregates in plugin state

Instead of recomputing a total, keep it in plugin state and apply a delta:

```ts
apply(tr, prev) {
  if (!tr.docChanged) return prev;
  let total = prev.total;
  for (const changed of changedTopLevelBlocks(tr)) {
    total -= cachedValueFor(changed.before) ?? 0;
    total += compute(changed.after);
  }
  return { total };
}
```

Two caveats worth stating plainly:

- **Floating-point/derived drift.** Integer counters are exact. If a delta scheme could drift, add a
  cheap consistency check and a full recompute on idle.
- **Do not store position lists in plugin state.** Remapping a stored array of H positions through
  `tr.mapping` is O(H) per transaction, which reintroduces the linear cost you removed. Key by
  `blockId` instead and resolve positions lazily, only for the entries actually being displayed.

---

## 4. Applying this to each offender

Ordered by expected impact.

### 4.1 `BlockId` — two distinct problems

`packages/editor/src/extensions/block-id/block-id.ts:74-118`

**Problem A — an O(top-level) scan on every `docChanged`.** `tr.doc.forEach(...)` walks every
top-level block to look for missing or duplicate IDs, on every keystroke.

**Fix:** only new nodes can lack an ID or duplicate one, so walk only the changed ranges
(Technique 1). Maintain the `Set` of known IDs in plugin state, updated by delta (Technique 3),
rather than rebuilding it from scratch each time. → O(Δ).

**Problem B — `BatchAttributeStep` destroys structural sharing.** This is the more serious of the
two and is not obvious from reading the extension. In
`packages/editor/src/utils/batch-attribute-step.ts:52-88`, the branch for nodes that are *not* being
updated reads:

```ts
} else {
  if (!node.isLeaf && node.content.size > 0) {
    const newContent = this.updateContent(node.content, pos + 1, updateMap);
    nodes.push(node.copy(newContent));   // <-- new object identity, even though nothing changed
  } else {
    nodes.push(node);                    // leaves keep identity
  }
}
```

Every non-leaf node in the document is rebuilt with `node.copy()` whether or not it was touched. The
consequences go beyond the O(N) cost:

- **It invalidates Guarantee B for the whole document.** Every `WeakMap` cache in §3 misses
  completely on the next transaction. This one function can defeat every other optimization in this
  document.
- It is worst exactly when it hurts most: opening a legacy note with no `data-block-id` attributes
  assigns IDs to *every* block, rebuilding the entire document during load.

**Fix:** return the original node unchanged when no update applies to it or to anything in its
subtree. Determine that by checking whether any update position falls within the node's range before
recursing — if none does, `nodes.push(node)` and skip the subtree entirely. That makes the step
O(updates × depth) instead of O(document), and preserves identity for everything else.

For the bulk-assignment case, assign IDs during parse/load rather than through a transaction, so
opening a note costs one pass instead of a full document rebuild.

### 4.2 Full HTML serialization on every edit

`apps/web/src/components/editor/tiptap.tsx:337-340` calls
`getHTMLFromFragment(editor.state.doc.content, editor.schema)` in `onUpdate`.

Two independent fixes, and you want both:

**(a) Do not call it per edit at all.** It is passed as a lazy thunk; keep it lazy all the way to the
actual save so only `deferredSave` forces it. This alone removes it from the typing path.

**(b) Make the serialization itself incremental** via Technique 2 — cache serialized HTML per
top-level block, keyed by node identity:

**Measured** (`results-5.json` → `serializationCost`):

| Blocks | Full serialize | Memoized | Speedup | Output identical |
|---|---|---|---|---|
| 500 | 0.458 ms | 0.102 ms | 4.5× | ✅ |
| 2,000 | 1.854 ms | 0.342 ms | 5.4× | ✅ |
| 4,000 | 3.730 ms | 0.698 ms | **5.3×** | ✅ |

**An honest limit:** this is 5×, not O(1), and it cannot be O(1). Even with every block cached,
*concatenating* the result is proportional to output size. Serialization can be made ~5× cheaper but
never free — which is precisely why fix (a) matters more than fix (b). Get it off the keystroke path;
make it cheaper for when it does run.

This also depends on 4.1's `BatchAttributeStep` fix. Without it, the cache never hits.

### 4.3 Note statistics — four full-document passes

`deferredUpdateNoteStatistics` (`tiptap.tsx:164`) runs `textBetween` over the whole document, then
`countWords`, `countParagraphs` (a full `nodesBetween`), and a `countSpaces` regex.

**Fix:** per-block counts cached by node identity, with a running total (Techniques 2 + 3).

**Measured** (`results-5.json` → `wordCountCost`), against ground truth each time:

| Blocks | Full recount | Incremental | Speedup | Correct |
|---|---|---|---|---|
| 500 | 0.621 ms | 0.119 ms | 5.2× | ✅ |
| 2,000 | 2.163 ms | 0.461 ms | 4.7× | ✅ |
| 4,000 | 4.507 ms | 0.834 ms | **5.4×** | ✅ |

**Another honest limit:** the version measured above still scans all `childCount` children to test
cache membership, so it is O(N) with a very small constant — hence 5×, not ∞. Driving the update from
the step maps instead (Technique 1) visits only the 4 nodes measured in §2 and is genuinely O(Δ).
The 5× figure is therefore a *lower bound* on what this fix delivers.

Word count also does not need to be exact in real time. Computing it on `requestIdleCallback` is a
reasonable complement once the algorithm is O(Δ).

### 4.4 Table of contents — a DOM walk that forces layout

`packages/editor/src/utils/toc.ts:53-86` runs `querySelectorAll("h1..h6")` over the live DOM and
calls `getOffsetTopRelativeTo` per heading — an offsetParent chain walk that forces synchronous
layout. Triggered whenever any heading changes (`tiptap.tsx:315-341`).

**Fix:** derive the TOC from document state, keyed by `blockId`, updated only when a changed range
contains a heading. Resolve scroll offsets lazily at click time for the single heading being
navigated to, rather than for all headings on every change.

This is also a hard prerequisite for virtualization
([02-design.md](02-design.md#stage-3--true-virtualization-contingency)), where off-screen headings
are not in the DOM at all and the current implementation would silently produce a partial TOC. The
existing `.callout` exclusion (`closestWithin`) becomes an ancestor check on the node tree.

### 4.5 `undo`/`redo` availability probed on every transaction

`tiptap.tsx:345-353` calls `editor.can().redo()` and `editor.can().undo()` in `onTransaction`, each
spinning up a dry-run transaction.

**Fix:** read `prosemirror-history`'s plugin state directly — `undoDepth(state)` and `redoDepth(state)`
are O(1) lookups. No dry runs.

### 4.6 Task list statistics

`packages/editor/src/extensions/task-list/task-list.ts:236-325` calls `countCheckedItems` over the
entire root task list on every change; already flagged in-code at `:204`.

**Fix:** Technique 2 keyed by the task-list node, combined with a running checked/total pair. A
1,000-item checklist then costs one item's recount per toggle instead of 1,000.

### 4.7 Remaining passes

- `packages/editor/src/extensions/heading/heading.ts:411-465` — `changedDescendants` per `docChanged`.
  Already diff-based; verify it is bounded by step ranges rather than walking from the root.
- `packages/editor/src/extensions/code-block/highlighter.ts:271-273` — `updateSelection` runs on
  *every* transaction including pure selection changes. Gate on whether the selection actually moved
  in or out of a code block.

---

## 5. What genuinely cannot be made O(Δ)

Stating the limits explicitly, so the design is not oversold:

| Work | Floor | Why |
|---|---|---|
| Full HTML serialization for save | **O(document)** | The output string is proportional to the document. Mitigate by frequency (only on save), not complexity. |
| Initial load: parse + block-ID assignment | **O(document)** | Unavoidable one-time cost. ~8 ms for an 850 KB note ([01 § 4](01-feasibility-proof.md#4-what-virtualization-does-not-fix)) — not a problem. |
| Bulk operations (select-all, large paste, find-replace-all) | **O(Δ)**, where Δ is genuinely large | Correct and expected. |
| DOM rendering | Not addressed here | That is what [02-design.md](02-design.md) Stages 1–3 cover. |

The two workstreams are complementary and neither substitutes for the other: this document removes
cost proportional to *document size per keystroke*; Stages 1–3 remove cost proportional to *rendered
DOM size*.

---

## 6. Suggested architecture: one shared document index

Rather than each extension separately re-deriving what changed, add a single low-level plugin that
computes it once per transaction and exposes it to everyone else. Extensions become consumers instead
of each running their own walk.

```ts
interface DocumentIndex {
  // O(Δ) — from tr.mapping.maps
  changedRanges: { from: number; to: number }[];
  changedBlocks: { node: Node; pos: number; blockId: string }[];
  deletedBlockIds: string[];

  // running aggregates, delta-maintained
  stats: { words: number; characters: number; paragraphs: number };

  // blockId -> heading, delta-maintained; positions resolved lazily
  headings: Map<string, { level: number; text: string }>;
}
```

Benefits: the changed-range computation happens once rather than per extension; there is one place to
test the O(Δ) property; and it gives virtualization the state-derived TOC and height-map keys it needs
later. Register it early so its state is available to extensions that run after it.

---

## 7. Rollout and verification

**Sequencing.** 4.1 (`BatchAttributeStep`) must come **first** — until identity is preserved, every
`WeakMap` optimization downstream is dead on arrival. Then 4.2(a), which is a one-line change with
the largest immediate effect. Then the rest in the order listed.

**The test that matters.** This work changes *how* values are computed, never *what* they are. So
every incremental computation must be tested against a full recomputation on the same document, after
randomized edit sequences — the same differential approach as
[04-test-plan.md § 0](04-test-plan.md#0-the-highest-value-test-differential-fuzz). The POC already
does this for word count (`correct: true` at every size), and it is the pattern for all of them:
after each random operation, assert `incrementalValue === fullRecompute(doc)`.

Include in the fuzz corpus the cases most likely to break delta logic: block deletion, block splits
and joins, undo/redo, paste of multiple blocks, and select-all-replace.

**The regression gate.** Assert the O(Δ) property directly rather than measuring milliseconds:

> Typing p95 on a 4,000-block note must be within 1.5× of typing p95 on a 500-block note.

That gate fails loudly if anyone reintroduces a document-wide pass, and unlike an absolute-latency
threshold it is not machine-dependent or flaky in CI. A complementary structural test — assert that
`doc.child(i) === previousDoc.child(i)` for all untouched blocks after a transaction — would catch a
regression like the `BatchAttributeStep` one automatically.
