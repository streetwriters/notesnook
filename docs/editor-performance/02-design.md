# 02 — Design

Four stages, ordered cheapest-and-safest first. Each is independently shippable. Stage 3 is the
"hidden paging" originally asked for; Stages 0–2 exist because the measurements in
[01-feasibility-proof.md](01-feasibility-proof.md) show they deliver most of the benefit for a small
fraction of the risk.

---

## Stage 0 — Eliminate document-wide per-transaction work

> **[05-per-transaction-work.md](05-per-transaction-work.md) covers this stage in full** — the
> underlying technique, measurements proving it works, per-offender rewrites, and the honest limits.
> What follows is the summary.

**Why first:** [§ 4 of the proof](01-feasibility-proof.md#4-what-virtualization-does-not-fix) measured
that no amount of virtualization improves this. It is the mechanism behind "it gets slower and slower
the longer the note is," and it is the only stage that addresses that symptom directly.

Every one of the following runs on **every transaction** or **every document change**. Costs are
O(document size), so they scale with note length regardless of what is rendered.

### 0.1 — `BlockId` rewrites the whole document on every edit

`packages/editor/src/extensions/block-id/block-id.ts:74-118` runs an `appendTransaction` on every
`docChanged` that does `tr.doc.forEach(...)` over all top-level nodes, then applies a
`BatchAttributeStep`. That step
(`packages/editor/src/utils/batch-attribute-step.ts:35-90`) **recursively rebuilds the entire document
Fragment**.

*Fix:* only inspect nodes the transaction actually touched. `packages/editor/src/utils/prosemirror.ts`
already exports `getChangedNodes` / `getExactChangedNodes` for exactly this — the code-block
highlighter already uses them. Assign IDs only to genuinely new blocks; skip the pass entirely when
`tr.steps` contains no structural change.

### 0.2 — Full HTML serialization on every keystroke

`apps/web/src/components/editor/tiptap.tsx:337-340` calls
`getHTMLFromFragment(editor.state.doc.content, editor.schema)` in `onUpdate`, serializing the entire
document to a string. It is passed as a lazy thunk, but `onSave` invokes it.

*Fix:* keep it lazy all the way to the actual save, and let the existing `deferredSave` debounce
(`apps/web/src/components/editor/index.tsx:124`) be the only thing that triggers it. On mobile the
equivalent is `useEditorController.ts:241` (`editor.getHTML()`), already debounced 300 ms — consider
raising that for large notes.

### 0.3 — Four full-document passes for statistics

`deferredUpdateNoteStatistics` (`tiptap.tsx:164`) performs `textBetween` over the whole document, then
`countWords`, `countParagraphs` (a full `nodesBetween`), and a `countSpaces` regex. Debounced 1000 ms,
but each invocation is O(document).

*Fix:* maintain counts incrementally from transaction steps, or compute them in a Web Worker (web) /
off the render path (mobile). Word count does not need to be exact in real time.

### 0.4 — `undo`/`redo` availability probed on every transaction

`tiptap.tsx:345-353` calls `editor.can().redo()` and `editor.can().undo()` in `onTransaction`. Each
spins up a dry-run transaction.

*Fix:* derive from `history` plugin state (`prosemirror-history` exposes depth) instead of dry runs,
or debounce with the existing 200 ms toolbar refresh.

### 0.5 — Table-of-contents walks the rendered DOM and forces layout

`packages/editor/src/utils/toc.ts:53-86` runs `querySelectorAll("h1..h6")` over the live DOM and calls
`getOffsetTopRelativeTo` per heading — an offsetParent chain walk that forces synchronous layout.
Triggered from `tiptap.tsx:315-341` whenever any heading changes.

*Fix:* build the TOC from **document state**, not the DOM. This is also a hard prerequisite for
Stage 3, where off-screen headings are not in the DOM at all. Note it must preserve the existing
`.callout` exclusion (`closestWithin`), which becomes a node-ancestor check.

### 0.6 — Other per-transaction passes

- `packages/editor/src/extensions/task-list/task-list.ts:236-325` — `countCheckedItems` recursively
  counts the entire root task list on every change. Already flagged in-code at `:204`.
- `packages/editor/src/extensions/heading/heading.ts:411-465` — `changedDescendants` diff walk per
  `docChanged`.
- `packages/editor/src/extensions/code-block/highlighter.ts:271-273` — `updateSelection` on *every*
  transaction, including pure selection changes.

### 0.7 — Cheap independent wins

- **Disable spellcheck on large notes.** Repeatedly reported as a major Chromium cost at scale
  ([forum](https://discuss.prosemirror.net/t/performance-issues-with-prosemirror-and-chrome/2498?page=2)).
  A `spellcheck="false"` toggle above a word threshold is a one-line change.
- **Reconsider `preserveWhitespace: true`** (`packages/editor/src/index.ts:411`), which retains
  whitespace text nodes everywhere and inflates both document and DOM size.
- **History depth is 200** (`index.ts:244-247`) — 200 retained document snapshots. Consider scaling
  depth down for very large notes.

---

## Stage 1 — `content-visibility: auto`

**Measured: 5.8× forced layout, 4.9× mount, 3.5× typing p95, with zero functional breakage.**
See [§ 5 of the proof](01-feasibility-proof.md#5-the-cheaper-alternative-content-visibility-auto).

This is close to a pure CSS change. It is the best effort-to-benefit ratio in the whole plan.

### Implementation

In `packages/editor/styles/styles.css`, applied to top-level blocks only:

```css
.ProseMirror > * {
  content-visibility: auto;
  contain-intrinsic-size: auto 40px;
}
```

The `auto` keyword in `contain-intrinsic-size` is essential: it makes Chromium remember each
element's **last-rendered real size**, so the scroll-height estimate converges as the user scrolls
rather than staying wrong. Without it, height error is permanent.

### Per-type intrinsic sizes

A single 40 px guess produced a 6.3 % scroll-height overestimate in testing. Tighten it per block
type to reduce initial scrollbar drift:

```css
.ProseMirror > p            { contain-intrinsic-size: auto 24px; }
.ProseMirror > h1, > h2, > h3 { contain-intrinsic-size: auto 40px; }
.ProseMirror > ul, > ol     { contain-intrinsic-size: auto 120px; }
.ProseMirror > pre          { contain-intrinsic-size: auto 200px; }
.ProseMirror > table        { contain-intrinsic-size: auto 300px; }
```

### Deliberate exclusions

Do **not** apply containment to:

- **`table`** — `isolating: true` with complex internal layout; column-resizing
  (`extensions/table/table.ts:489-537`) measures cell geometry and will misread contained subtrees.
- **The block containing the selection** — Chromium already exempts elements with selection or focus
  in their subtree, but do not rely on it while a caret is being placed.
- **Anything measured by `keep-in-view`** (`extensions/keep-in-view/keep-in-view.ts:61-69`), which
  calls `posToDOMRect` and will read intrinsic rather than real sizes for skipped blocks.

### Gate it

Apply only above a threshold (say 500 top-level blocks) via a class on the editor root, so small
notes — the overwhelming majority — keep exact geometry and are unaffected by any of this.

### Must be verified before shipping

Our testing was Chromium-only. **Safari/WebKit support for `content-visibility` is materially newer
and less proven, and mobile Notesnook renders inside a platform WebView.** Run
`poc/proof4.html` on:

- iOS WKWebView (the real target for `apps/mobile` on iOS)
- Android WebView (Chromium-based; expected to match our results)
- Desktop Safari and Firefox (web app)

If WebKit misbehaves, gate the CSS behind `@supports (content-visibility: auto)` plus a UA check.

---

## Stage 2 — Lazy React node views

**Why:** `packages/editor/src/extensions/react/react-portal-provider.tsx:38-66` creates **one React
root per node-view element** and renders it **synchronously**:

```ts
render(Component: FunctionComponent, container: HTMLElement) {
  const root = this.roots.get(container) || createRoot(container);
  flushSync(() => root.render(<Component />));
  this.roots.set(container, root);
}
```

`ReactNodeView.init()` calls this immediately, so **every** image, code block, table, attachment,
embed, audio, task list, and — worst of all — **every individual `taskItem`
(`extensions/task-item/task-item.ts:72-84`)** costs a `createRoot` + `flushSync` at document load. A
note with a 1000-item checklist creates ~1001 React roots synchronously during load.

Our POC measured the analogous effect: **60 → 0** expensive node-view constructions when off-screen
blocks are not rendered.

### Design

Defer `init()`'s render until the node view's element intersects the viewport. The codebase already
has the primitive — `packages/editor/src/hooks/use-observer.ts`, used today for lazy image loading.

1. In `ReactNodeView.init()`, render a lightweight non-React placeholder with an estimated size.
2. Observe the element with a shared `IntersectionObserver` (one observer, many targets — not one per
   node).
3. On intersection, perform the `createRoot` + render, then unobserve.
4. On `destroy()`, unobserve and `root.unmount()`.

Critically, `contentDOM` stays intact throughout, so this is **not** virtualization: ProseMirror still
manages content and every node stays in the DOM. Only the React shell is deferred. Find-in-page,
selection, and the clipboard are unaffected.

Replace `flushSync` with a normal render wherever ProseMirror does not require the DOM synchronously;
`flushSync` inside a node-view constructor forces a synchronous React commit per node.

---

## Stage 3 — True virtualization (contingency)

Only if Stages 0–2 leave large notes unusable. This is the highest-risk stage and the one with
confirmed user-visible breakage ([03-caveats.md](03-caveats.md)).

### Decision: per-block, **not** a page-wrapper node

Both variants were built and measured. Per-top-level-block wins on both axes.

**Performance** (600 blocks, `results-1.json`): per-block reached **3.4 ms mount / 635 DOM nodes**
versus the page wrapper's 8.7 ms / 10,836 — finer granularity means a tighter rendered window.

**Risk** is the stronger argument. A `page` wrapper changes `doc: block+` into `doc: page+`, and four
separate Notesnook subsystems assume top-level blocks are direct children of `doc`:

| Subsystem | Location | Assumption |
|---|---|---|
| `BlockId` | `extensions/block-id/block-id.ts:85-104` | `tr.doc.forEach` — top level only |
| Heading collapse | `extensions/heading/heading.ts:309-370` | `toggleNodesUnderPos` walks flat top-level siblings by `nodeSize` |
| Table of contents | `utils/toc.ts:53-86` | flat heading scan |
| Empty-area click / quirks | `index.ts:362-367`, `tiptap.tsx:505-525`, `editor-mobile/.../editor.tsx:388-460` | inspect `doc.firstChild` / `doc.lastChild` types |

A wrapper node also changes the **serialized HTML shape of every existing note**, which is a
migration with sync and cross-client-compatibility consequences. Per-block virtualization keeps
`doc: block+` byte-identical. **Do not introduce a wrapper node.**

### Constraint: how node views must be composed

Verified from source — this rules out the obvious implementation. `prosemirror-view` builds its node
view map first-wins, and consults the view's own props **before** any plugin:

```js
function buildNodeViews(view) {
    let result = Object.create(null);
    function add(obj) {
        for (let prop in obj)
            if (!Object.prototype.hasOwnProperty.call(result, prop))   // first wins
                result[prop] = obj[prop];
    }
    view.someProp("nodeViews", add);   // props first, then directPlugins, then state plugins
```

Tiptap supplies `nodeViews: this.extensionManager.nodeViews` as a view prop
(`@tiptap/core/dist/index.js:4253`). **Therefore a plugin cannot override Tiptap's node views.** The
virtualization layer must *wrap the `extensionManager.nodeViews` map* before it reaches
`EditorView` — decorating each existing factory rather than competing with it.

```ts
function withVirtualization(nodeViews: Record<string, NodeViewConstructor>) {
  const wrapped: Record<string, NodeViewConstructor> = {};
  for (const type of TOP_LEVEL_BLOCK_TYPES) {
    const inner = nodeViews[type];
    wrapped[type] = (node, view, getPos, decorations, innerDecorations) => {
      const isTopLevel = view.state.doc.resolve(getPos()).depth === 0;
      const materialize = decorations.some((d) => d.spec?.materialize);

      if (!isTopLevel || materialize) {
        // delegate to whatever Notesnook already does for this node type
        return inner
          ? inner(node, view, getPos, decorations, innerDecorations)
          : defaultNodeView(node);
      }
      return placeholderNodeView(node, getPos);
    };
  }
  return { ...nodeViews, ...wrapped };
}
```

### The placeholder node view

```ts
function placeholderNodeView(node: Node, getPos: () => number): NodeView {
  const dom = document.createElement(node.type.spec.placeholderTag ?? "div");
  dom.setAttribute("data-virtual-placeholder", "true");
  dom.style.height = `${heightFor(node)}px`;

  return {
    dom,
    contentDOM: null,          // <- children are never rendered

    // MANDATORY. Without this, CustomNodeViewDesc.update returns false on
    // every change (prosemirror-view:1561) and PM rebuilds the view each
    // keystroke — slower than not virtualizing at all.
    update(newNode, newDecos) {
      if (newNode.type !== node.type) return false;
      if (newDecos.some((d) => d.spec?.materialize)) return false;  // force rebuild as real
      node = newNode;
      dom.style.height = `${heightFor(newNode)}px`;
      return true;
    },

    ignoreMutation: () => true
  };
}
```

Returning `false` from `update` on a mode change is the intended way to switch between placeholder
and real: ProseMirror destroys the view and re-invokes the factory, which then takes the other
branch.

### Height map — the hard part

Marijn names this as the central difficulty: viewport rendering
["requires knowing the height of everything, even the parts that you never rendered."](https://discuss.prosemirror.net/t/lazy-rendering-for-prosemirror/1486)

**Notesnook has an unusual advantage here.** The `BlockId` extension already assigns a stable
`blockId` attribute to every top-level block. That gives a persistent cache key that survives
position changes, edits elsewhere in the document, and reloads — which a position-keyed cache does
not.

- Key the height cache by `node.attrs.blockId`.
- Record real `offsetHeight` in the materialized view's `destroy()` and on each `update()`.
- Estimate unmeasured blocks per node type (same table as Stage 1).
- Persist the map alongside the note so a reopened note has accurate geometry immediately.
- Set `overflow-anchor: none` on the scroll container to prevent oscillation between spacer height
  changes and scroll anchoring — a documented failure mode in virtualized lists
  ([aspnetcore#65939](https://github.com/dotnet/aspnetcore/issues/65939)).

### Viewport tracking

A plugin holding `{from, to}` document positions, emitting `Decoration.node(..., {materialize: true})`
for blocks in range. Update it from a throttled scroll handler (`requestAnimationFrame`), with an
overscan margin of roughly one viewport in each direction.

**Always materialize, regardless of scroll position:**

- the block containing the selection, plus its immediate neighbours (otherwise caret movement into a
  placeholder cannot resolve to a text position);
- the first and last blocks (empty-area click handlers inspect `doc.firstChild` / `doc.lastChild`);
- any block targeted by an active search match or a scroll-to-block request.

### Required companion work

Stage 3 is not complete without these. They are not optional polish.

1. **`beforeprint` force-render.** ProseMirror has *no* printing support — a source grep for
   `beforeprint` in `prosemirror-view@1.34.2` returns zero hits, versus six in `@codemirror/view`.
   Listen for `beforeprint`, set the viewport to the whole document, force a synchronous re-render,
   and restore on `afterprint`.
2. **Custom find UI.** Browser find-in-page is confirmed broken
   (`results-2.json` → `browserFindFinds: false`). Notesnook's existing
   `extensions/search-replace/search-replace.ts` already searches **document state** rather than the
   DOM, so it keeps working — but it must be promoted to the primary find affordance, and Ctrl+F
   must be intercepted so users don't silently get the broken browser one.
3. **State-based table of contents** — Stage 0.5 becomes mandatory here.

---

## Mobile considerations

`apps/mobile` hosts the editor in a `react-native-webview` running `packages/editor-mobile`
(`apps/mobile/app/screens/editor/index.tsx:149-196`). Two consequences:

- **Every stage applies inside the WebView** and needs verification on both iOS WKWebView and Android
  System WebView, which are different engines. Stage 1 in particular is Chromium-verified only.
- **The bridge sends whole-note HTML as a single JSON string**
  (`apps/mobile/app/screens/editor/tiptap/use-editor.ts:758-768`, with a 10-second timeout that
  itself signals the payload size). None of the four stages changes this. If large-note *loading* is
  a distinct complaint from typing lag, that transfer is a separate investigation — and note from
  [§ 4](01-feasibility-proof.md#4-what-virtualization-does-not-fix) that ProseMirror parsing is only
  ~8 ms for an 850 KB note, so the cost is in transfer and serialization, not parsing.

`react-freeze` already suspends non-active tabs (`editor-mobile/src/App.tsx:169`), so per-tab cost is
handled; per-note cost is not.
