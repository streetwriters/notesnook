# 03 — Caveats and risks

Ranked by severity. Each entry states which stage introduces it, whether it is **verified** or
**unverified**, and what mitigation exists.

Stages 0–2 introduce **no user-visible breakage**. Everything in the "blocking" and "serious"
sections below is introduced by **Stage 3 only**. That asymmetry is the main argument of this study.

---

## Blocking — must be solved before Stage 3 ships

### 1. Browser find-in-page stops working — VERIFIED

Ctrl+F / Cmd+F cannot find text that is not in the DOM. Measured directly: `window.find()` returns
`false` for off-screen content under virtualization (`results-2.json` → `findInPage`), while the same
content is present in document state.

Marijn Haverbeke on the same problem in CodeMirror, where viewporting does ship:
> ["The way this breaks browser search is very annoying, but a trade-off that seems unavoidable with this design."](https://discuss.codemirror.net/t/viewport-issues-with-cm-6/3586)

And for ProseMirror specifically:
> ["For search, you'll want to provide our own custom dialog."](https://discuss.prosemirror.net/t/lazy-rendering-for-prosemirror/1486)

**Mitigation:** Notesnook already has a state-based search
(`packages/editor/src/extensions/search-replace/search-replace.ts:92-183` — it searches
`doc.descendants()`, not the DOM). It must become the primary find affordance and must intercept
Ctrl+F, so users never silently fall through to a browser find that quietly misses most of the note.
This is a UX regression even when handled well: users lose browser find's highlight-all and its
familiar behaviour.

**Not an issue under Stage 1** — `content-visibility: auto` explicitly preserves find-in-page, both
per [CSS Containment Level 2 § 4](https://www.w3.org/TR/css-contain-2/) and by our own measurement.

### 2. Printing produces a mostly-blank document — VERIFIED

ProseMirror has no printing support whatsoever. A source grep for `beforeprint` in
`prosemirror-view@1.34.2` returns **zero** hits; `@codemirror/view` has six, because CodeMirror had to
solve exactly this. Marijn, 2018:
> ["you should be able to use the `beforeprint` command to force-render the whole document, but we haven't implemented that."](https://discuss.prosemirror.net/t/lazy-rendering-for-prosemirror/1486)

**Mitigation:** implement it — `beforeprint` → materialize the entire document → force synchronous
re-render → restore on `afterprint`. Note this makes printing a large note as slow as rendering it
fully, which is acceptable, and that "export to PDF" paths must use the same escape hatch.

### 3. Caret coordinates are wrong in unrendered regions — VERIFIED

`domFromPos` returns `{node: this.dom, offset: 0, atom: pos + 1}` for any position inside a
contentDOM-less view (`prosemirror-view:896`). `coordsAtPos` consumes that `atom` marker and returns
the **placeholder's bounding box** — so every position within an unrendered block reports the same
coordinates.

It does **not** throw (verified: assertions P4/P4b), which is what makes the approach viable at all.
But anything that positions UI from a document position degrades: hover popups, the link tooltip,
`keep-in-view` scroll adjustment (`extensions/keep-in-view/keep-in-view.ts:61-69`), and any future
collaborative cursors.

**Mitigation:** always materialize the block containing the selection plus neighbours, so the caret is
never *in* an unrendered region. Off-screen positions still report coarse coordinates; scroll-to-position
must materialize first, then measure.

**Not an issue under Stage 1** — measured accurate (17 px caret height, correct value).

---

## Serious — Stage 3

### 4. Scroll-height estimation is the central unsolved problem — VERIFIED as hard

> ["The main difficulty are with reacting to scrolling in such a way that the visible part of the document is always drawn, which requires knowing the height of everything, even the parts that you never rendered."](https://discuss.prosemirror.net/t/lazy-rendering-for-prosemirror/1486)

The chicken-and-egg, stated in-thread by another practitioner: a block's height depends on rendering
it. Symptoms of getting it wrong: scrollbar jumping, scroll position drifting during fast scrolling,
and the "scroll to a position, land somewhere else" bug.

**Mitigations:** key the height cache by the existing stable `blockId` (see
[02-design.md](02-design.md#height-map--the-hard-part)); persist it with the note; `overflow-anchor: none`
to prevent oscillation; generous overscan. Under Stage 1 this manifests only as a bounded, converging
scrollbar inaccuracy — we measured **6.3 %** overestimate, self-correcting via `contain-intrinsic-size: auto`.

### 5. Browser extensions break — VERIFIED for CodeMirror

Grammarly and similar extensions assume the whole document is in the DOM
([report](https://discuss.codemirror.net/t/viewport-issues-with-cm-6/3586)). Marijn's response is
that such extensions are not something he is sympathetic to — which is to say, there is no fix.

**Mitigation:** none available. Accept, and scope Stage 3 to notes large enough that the trade is
worth it.

### 6. Accessibility — UNVERIFIED, treat as a real risk

Content removed from the DOM is necessarily absent from the accessibility tree, so screen readers
cannot reach unrendered content. This is inference from architecture: **both literature reviews
searched for and failed to find any primary source on screen-reader behaviour in a partially-rendered
`contenteditable`.**

**This must be tested directly with VoiceOver and NVDA before Stage 3 ships to users.** Do not assume
it is fine, and do not assume it is catastrophic.

**Not an issue under Stage 1** — per spec, `content-visibility: auto` content remains in the
accessibility tree, unlike `hidden` or `display: none`.

### 7. Anything that reads content from the DOM silently returns partial results

Codebase-specific. Known instances:

- `packages/editor/src/utils/toc.ts:53-86` — builds the TOC by `querySelectorAll` over rendered DOM.
  **Would silently produce a TOC containing only visible headings.** Must move to document state
  (Stage 0.5) *before* Stage 3.
- `apps/mobile/.../commands.ts` `getTableOfContents` — same path via the bridge.
- Any future feature that scans `view.dom`.

**Mitigation:** audit for `querySelectorAll` / `textContent` against `view.dom`. Make state-derived
data the rule.

---

## Moderate

### 8. `update()` is mandatory, and omitting it inverts the optimization — VERIFIED

`prosemirror-view:1561` — a non-leaf `contentDOM`-less node view *without* a custom `update` returns
`false` on every change, forcing destroy-and-rebuild on **every keystroke**. A naive implementation
is slower than no virtualization at all. Called out here because it is the most likely way to get
this subtly wrong. Covered by a specific test in [04-test-plan.md](04-test-plan.md).

### 9. Interaction with existing node views — Stage 3

Notesnook already has node views on most block types, several of them React
(`codeblock`, `image`, `table`, `taskList`, `taskItem`, `attachment`, `embed`, `webclip`, `audio`,
plus plain-DOM `heading`, `callout`, `outlineList`, `checkListItem`). The virtualization layer must
**wrap** these, not replace them — and cannot do so from a plugin, because
`view.props.nodeViews` is consulted before plugins and `buildNodeViews` is first-wins (verified;
see [02-design.md](02-design.md#constraint-how-node-views-must-be-composed)).

Highest-risk node type: **`table`**, which is `isolating: true` and whose column-resizing
(`extensions/table/table.ts:489-537`) measures cell geometry. Consider excluding tables from
virtualization entirely.

### 10. WebKit / WebView support for `content-visibility` — UNVERIFIED — Stage 1

Our Stage 1 measurements are **Chromium-only**. Mobile Notesnook runs inside a platform WebView, and
iOS uses WKWebView. WebKit support is newer and less battle-tested.

**Must be verified on iOS WKWebView, Android WebView, Safari, and Firefox before shipping.** Gate
behind `@supports (content-visibility: auto)`. This is the main open question for the stage that is
otherwise lowest-risk.

### 11. One practitioner tried containment and retreated — context, not evidence against

A ProseMirror user reported handling 100,000+ DOM nodes with containment, then in 2023
[switched to `display: none`](https://discuss.prosemirror.net/t/performance-issues-with-prosemirror-and-chrome/2498?page=2)
citing "stability and browser compatibility issues."

Important qualification: they used `content-visibility: **hidden**`, the variant that per spec does
*not* preserve find-in-page or selection — a different and strictly worse thing than what Stage 1
proposes. Their report predates several Chromium containment fixes. Informative, not disqualifying,
and a reason to take caveat 10 seriously.

---

## Minor

### 12. `offsetHeight` on contained elements returns the estimate — VERIFIED — Stage 1

Measured: 40 px (the `contain-intrinsic-size` guess) versus 17 px real. Any code measuring block
geometry must either force rendering first or tolerate estimates. Affects `keep-in-view` and TOC
offset calculations.

### 13. Spellcheck — not breakage, but relevant

Chromium spellcheck cost scales with rendered DOM. Virtualization *helps* it. Independently,
disabling spellcheck on large notes is one of the cheapest wins available (Stage 0.7).

### 14. Undo/redo — VERIFIED SAFE

`prosemirror-history` operates on state and steps, never the DOM. Verified at runtime (assertion P6:
undo of an off-screen edit) and across 500 fuzz operations including undo.

### 15. Collaborative cursors — UNVERIFIED

Built on `coordsAtPos`, so they inherit caveat 3. No primary source found on behaviour at unrendered
positions. Not currently a Notesnook feature; note it as a constraint on future real-time collaboration.

---

## Risk summary by stage

| Stage | Blocking risks | Reversibility | Verdict |
|---|---|---|---|
| **0** — per-transaction work | none | trivially reversible | **Do it.** Fixes the actual reported symptom |
| **1** — `content-visibility` | none; one open question (caveat 10) | CSS-only, instant revert | **Do it**, after cross-browser verification |
| **2** — lazy React node views | none | contained to node-view layer | **Do it** if Stage 0–1 insufficient |
| **3** — true virtualization | caveats 1, 2, 3, 6 | invasive; feature-flag it | **Contingency only.** No prior art exists — we would be first |
