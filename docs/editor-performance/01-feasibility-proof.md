# 01 — Feasibility proof

Everything here is either a citation to `prosemirror-view@1.34.2` source (the version pinned in
`packages/editor/package.json`) or a measurement from a real headless Chrome run. Nothing is inferred
from documentation alone. Where a claim could not be verified, it says so.

Environment for all measurements: `HeadlessChrome/150.0.0.0`, Apple Silicon, macOS 25.5. Raw output
in [`poc/results-1.json`](poc/) … `results-4.json`.

---

## 1. The mechanism, proven from source

The question is whether ProseMirror can be made to *not render* part of a document while keeping that
part in editor state. It can, and the mechanism is a node view that omits `contentDOM`. Six source
citations establish that this is a supported path rather than an accident.

**(a) A content-bearing node may legally render without `contentDOM`, and its children are then never
rendered.** `prosemirror-view/dist/index.js:1278`:

```js
if (!contentDOM && !node.isText && dom.nodeName != "BR") {
    if (!dom.hasAttribute("contenteditable"))
        dom.contentEditable = "false";
```

ProseMirror explicitly handles the non-leaf-without-`contentDOM` case by marking the element
uneditable. Child rendering is gated on `contentDOM` throughout — `renderDescs(this.contentDOM, …)`
at `:1377`, and `updateChildren` is only reached when `contentDOM` is set. **No `contentDOM` ⇒ zero
child DOM.** That is virtualization.

**(b) Position lookups into unrendered content degrade gracefully — they do not throw.** This is the
single most important finding, because a throwing `domFromPos` would make the approach unusable.
`:896`:

```js
domFromPos(pos, side) {
    if (!this.contentDOM)
        return { node: this.dom, offset: 0, atom: pos + 1 };
```

Every position inside an unrendered region resolves to the placeholder element with an `atom` marker.
`coordsAtPos` consumes that marker and returns the placeholder's bounding box instead of a precise
caret rect. Degraded, but safe. Verified at runtime: assertions P4 and P4b below.

**(c) Unrendered content is restored from *state*, never from the DOM, when ProseMirror re-parses.**
`:1304`:

```js
if (!this.contentDOM) {
    rule.getContent = () => this.node.content;
}
```

This is what makes the approach safe rather than lossy: a DOM re-parse of a placeholder yields the
node's real content out of state, so content cannot be silently destroyed.

**(d) The browser cannot corrupt state through a placeholder.** `:1083`:

```js
ignoreMutation(mutation) {
    return !this.contentDOM && mutation.type != "selection";
}
```

**(e) Copy is serialized from document state, not from rendered DOM.** `:2740`, `serializeForClipboard`:

```js
let serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema);
let doc = detachedDoc(), wrap = doc.createElement("div");
wrap.appendChild(serializer.serializeFragment(content, { document: doc }));
…
let text = … || slice.content.textBetween(0, slice.content.size, "\n\n");
```

`content` comes from the selection's `Slice`. The live editor DOM is never touched. **Copy-all of
unrendered content works by construction**, which is the crux of the original question.

**(f) There is one trap, and it is load-bearing.** `:1561`, `CustomNodeViewDesc.update`:

```js
else if (!this.contentDOM && !node.isLeaf) {
    return false;
}
```

A `contentDOM`-less node view that does **not** supply its own `update` method returns `false` on
every state change, forcing ProseMirror to destroy and rebuild it on every keystroke — which would
make things *slower*, not faster. Supplying `spec.update` is mandatory, not optional. This is the
detail most naive attempts miss.

## 2. Runtime proof — 12 assertions

`poc/poc.html`, run via `node run.mjs 600`. A 600-block document (~215,000 characters) containing
paragraphs, headings, bullet lists, and deliberately expensive code-block node views. A sentinel
string is planted at 90 % depth, far outside the rendered window.

| # | Assertion | Result |
|---|---|---|
| P1 | Unrendered content is absent from the DOM | **pass** |
| P1 | …but present in document state | **pass** |
| P2 | `selectAll` spans the entire document | **pass** — `AllSelection` 0 → 219003 of docSize 219005 |
| P3 | Clipboard **text** contains unrendered content | **pass** |
| P3 | Clipboard **HTML** contains unrendered content | **pass** |
| P4 | `domAtPos` into unrendered region does not throw | **pass** |
| P4b | `coordsAtPos` into unrendered region does not throw | **pass** |
| P5 | An edit inside an unrendered region applies to state | **pass** |
| P5b | …and the edited region is still not in the DOM | **pass** |
| P6 | Undo of an off-screen edit works | **pass** |
| P7 | Scrolling into the region materializes real content | **pass** |
| P9 | Per-block variant also yields a complete clipboard | **pass** |

Copy-all of the virtualized editor produced **229,736 bytes of HTML and 217,861 characters of text**
while only ~10 % of the document was rendered.

> A 13th assertion (P8, "doc state unchanged by round-trip") reports `false` in `results-1.json`.
> That is an artifact of the test itself, not a defect: the benchmark types 50 characters into the
> document before comparing, and `218955 + 50 = 219005` exactly accounts for the difference. It is
> superseded by the far stronger differential fuzz below.

## 3. Differential fuzz — the strongest correctness evidence

Assertions can miss things a fuzz test catches. `poc/proof2.html` builds **two editors over an
identical document** — one fully rendered, one virtualized — and applies the **same** pseudo-random
edit sequence to both: text insertion, range deletion, mark toggling, undo, and viewport moves. After
*every* operation it compares `doc.toJSON()`.

| Blocks | Operations | Seed | Result |
|---|---|---|---|
| 200 | 150 | 1 | identical |
| 400 | 150 | 42 | identical |
| 100 | 200 | 7 | identical |

**500 operations, zero divergence, zero errors.** Virtualization is transparent to document state.

Also verified in the same file: `selectAll` followed by typing correctly wipes the **entire**
document including unrendered pages (27,840 characters → 8, one page remaining). This matters because
a naive implementation would delete only what is rendered.

## 4. What virtualization does *not* fix

This is the finding that most changes the recommendation, and it is the one thing the original
question did not anticipate.

`poc/proof3.html` adds a plugin that walks the whole document on every transaction — exactly what
word counting, table-of-contents extraction, and block-ID assignment do. Typing latency, median / p95
in ms:

| Blocks | plain | plain + doc-wide | virtualized | virtualized + doc-wide |
|---|---|---|---|---|
| 500 | 0.1 / 0.4 | 0.3 / 0.5 | 0 / 0.2 | 0.3 / 0.6 |
| 2000 | 0 / 0.2 | 0.8 / 2.0 | 0.1 / 0.1 | 0.8 / 1.3 |
| 4000 | 0.1 / 0.2 | **1.5 / 2.0** | 0.1 / 0.2 | **1.5 / 2.3** |

**Virtualization provides no benefit whatsoever against document-wide per-transaction work** — 1.5 ms
either way at 4000 blocks, scaling linearly with document size. Rendering fewer nodes does not make
`doc.descendants()` cheaper.

Notesnook currently runs **at least six** such passes per edit (see
[02-design.md § Stage 0](02-design.md#stage-0--eliminate-document-wide-per-transaction-work)),
including a full HTML serialization of the entire document. That is the mechanism behind "it gets
slower and slower."

The same file also rules out a suspected culprit — **HTML parsing is not the bottleneck**:

| Blocks | HTML bytes | `innerHTML` | ProseMirror parse |
|---|---|---|---|
| 5000 | 848,890 | 0.9 ms | **8.2 ms** |

Parsing an 850 KB note into a ProseMirror document costs ~8 ms. Whatever makes loading a large note
slow, it is not the parser.

## 5. The cheaper alternative: `content-visibility: auto`

CSS `content-visibility: auto` makes the browser skip layout and paint for off-screen subtrees
**while leaving them in the DOM**. Per [CSS Containment Level 2 § 4](https://www.w3.org/TR/css-contain-2/),
skipped content under `auto` "must still be available as normal to user-agent features such as
find-in-page, tab order navigation, etc., and must be focusable and selectable as normal."

Two independent literature reviews found **nobody had verified this works inside `contenteditable`** —
the one ProseMirror practitioner who tried it used `content-visibility: hidden` (the variant that
*does* break find-in-page) and eventually retreated to `display: none`. So we tested it directly.

`poc/proof4.html`, applying `content-visibility: auto; contain-intrinsic-size: auto 40px` to every
top-level block inside a live ProseMirror `contenteditable`:

| Blocks | Metric | Plain | `content-visibility` | Gain |
|---|---|---|---|---|
| 500 | mount | 14.4 ms | 2.9 ms | **5.0×** |
| 500 | forced layout (median) | 1.0 ms | 0.2 ms | **5.0×** |
| 500 | typing p95 | 0.5 ms | 0.1 ms | **5.0×** |
| 3000 | mount | 41.0 ms | 8.4 ms | **4.9×** |
| 3000 | forced layout (median) | 6.4 ms | 1.1 ms | **5.8×** |
| 3000 | typing p95 | 0.7 ms | 0.2 ms | **3.5×** |

And — the decisive part — **nothing broke**:

| Behaviour | Result |
|---|---|
| Off-screen content in DOM | ✅ yes |
| `window.find()` (browser find-in-page) finds off-screen text | ✅ **yes** |
| Clipboard contains off-screen content | ✅ yes |
| `coordsAtPos` on off-screen position | ✅ **accurate** (17 px caret height, correct) |
| `domAtPos` → `posAtDOM` round-trip | ✅ matches |
| Editing an off-screen block | ✅ applies correctly |

Compare against true virtualization, where `window.find()` returns **`false`** for the same content
(`results-2.json` → `findInPage.browserFindFinds: false`).

**One measured caveat.** Document height is estimated for skipped blocks, so `scrollHeight` is
approximate: 162,030 px reported vs 152,399 px actual at 3000 blocks — a **6.3 % overestimate** from
the 40 px `contain-intrinsic-size` guess against 17 px real blocks. `offsetHeight` on a skipped
element likewise returns the intrinsic estimate (40) rather than the true height (17). Using the
`auto` keyword (`contain-intrinsic-size: auto 40px`, as tested) makes Chromium remember each
element's last-rendered real size, so the estimate converges as the user scrolls. Tuning the
per-block-type default will shrink the initial error further.

## 6. Scale: what true virtualization buys

From `results-2.json`, page-wrapper virtualization with 3 pages rendered:

| Blocks | Mount (full) | Mount (virt) | DOM nodes (full) | DOM nodes (virt) | Mount gain | DOM reduction |
|---|---|---|---|---|---|---|
| 200 | 1.8 ms | 0.7 ms | 742 | 233 | 2.6× | 3.2× |
| 500 | 3.9 ms | 0.8 ms | 1,808 | 248 | 4.9× | 7.3× |
| 1000 | 7.5 ms | 0.8 ms | 3,584 | 273 | 9.4× | 13.1× |
| 2000 | 15.4 ms | 1.4 ms | 7,169 | 323 | 11.0× | 22.2× |
| 4000 | 37.8 ms | 3.6 ms | 14,414 | 423 | 10.5× | **34.1×** |

Full-render cost grows linearly; virtualized cost stays nearly flat. The DOM-node reduction is what
`content-visibility` cannot match — containment skips layout but every node still exists, still
consumes memory, and is still walked by ProseMirror's `ViewDesc` tree.

In the richer 600-block document of `results-1.json`, which includes expensive node views, the
contrast is starker still: **108,060 → 635 DOM nodes** and **60 → 0** expensive node-view
constructions for the per-block variant.

## 7. What the ecosystem says

Two independent literature reviews of the ProseMirror and CodeMirror forums, the specs, and the
source of both libraries. Full citations in [03-caveats.md](03-caveats.md).

The load-bearing points:

- ProseMirror deliberately does not virtualize. Marijn Haverbeke, 2022:
  ["The library puts the entire document in the DOM, yes."](https://discuss.prosemirror.net/t/improving-performance-loading-on-scroll/4972)
- He has never called it impossible, and his position has softened. 2017:
  ["I have no idea how to cleanly do that."](https://discuss.prosemirror.net/t/efficient-viewport-rendering-like-codemirror/577)
  → November 2025, on a block-mounting-controller proposal:
  ["This is definitely tricky to get right, but I don't see a reason why it couldn't work."](https://discuss.prosemirror.net/t/virtual-scroll-for-prosemirror/8882)
- **No published ProseMirror virtualization library or fork exists.** We would be first. Budget
  accordingly.
- His own profiling points at the browser, not the library — 2025:
  ["this turned out to be mostly due to the performance of browser layout and editing handling, rather than performance issues in ProseMirror itself."](https://discuss.prosemirror.net/t/how-to-handle-thousands-of-editor-instances-on-screen/8096)
  This is a direct argument for `content-visibility` (which targets layout) over DOM removal.
- In CodeMirror, where he *did* build viewporting, find-in-page breakage is
  ["a trade-off that seems unavoidable with this design."](https://discuss.codemirror.net/t/viewport-issues-with-cm-6/3586)
- Tiptap does not virtualize; its large-document demo is plain ProseMirror.
- Google Docs solved this by abandoning the DOM for `<canvas>` entirely
  ([announcement](https://workspaceupdates.googleblog.com/2021/05/Google-Docs-Canvas-Based-Rendering-Update.html)).
  Confluence degrades features on large pages rather than virtualizing.

Claims the reviews could **not** substantiate, and which should not be repeated as fact: Notion's,
Craft's, and Dropbox Paper's editor architectures (no primary sources found); screen-reader behaviour
in a partially-rendered `contenteditable`; and collaborative-cursor behaviour at unrendered positions.

## 8. Verdict

| Question | Answer |
|---|---|
| Is hidden paging possible in ProseMirror? | **Yes — proven, 12 assertions + 500-op fuzz** |
| Does Ctrl+A work? | **Yes** — `AllSelection` is state-derived |
| Does Copy All work? | **Yes** — clipboard serializes from state, never the DOM |
| Does undo/redo work? | **Yes** |
| Can you edit unrendered content? | **Yes** |
| Does browser find-in-page work? | **No** — verified broken. Needs a custom find UI |
| Does printing work? | **No** — needs a `beforeprint` force-render, which ProseMirror lacks entirely |
| Are caret coordinates accurate off-screen? | **No** — degrades to the placeholder's bounding box |
| Will it fix "typing gets slower and slower"? | **No, not on its own** — that is document-wide per-transaction work |
| Is there a cheaper option? | **Yes** — `content-visibility: auto`, 5.8× layout, zero breakage |
