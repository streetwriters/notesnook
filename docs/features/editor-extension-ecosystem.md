# Installable Editor Extension Ecosystem

> Status: Proposed · Author: feature-architect (synthesized) · Date: 2026-07-26
> Verdict: **RESHAPE** — ship as a phased, two-tier system; do **not** launch a full untrusted-JS marketplace on day one. See §15.

> Scope: **editor extensions only** (the Tiptap/ProseMirror editor), not app-wide plugins.

---

## 1. Problem

Notesnook ships every editor capability itself — nodes, marks, toolbar tools — all statically compiled into the editor bundle ([packages/editor/src/index.ts](../../packages/editor/src/index.ts), a 469-line file of hardcoded `import`s aggregated into one `getExtensions()` array, plus a static `tools` registry in [packages/editor/src/toolbar/tools/index.ts:108](../../packages/editor/src/toolbar/tools/index.ts#L108)). Every new editor feature is a first-party engineering + review + maintenance cost, so the long tail of requests (drawing, diagrams, spreadsheets, domain-specific nodes) never ships. Users want to bring their own. The job: **let the community build and install editor extensions without Notesnook shipping each one — without breaking the zero-knowledge model or handing untrusted code the user's decrypted notes.**

## 2. Demand evidence

Recurring, multi-year requests on `streetwriters/notesnook`, and — critically — most are *individual editor features that a plugin system would offload*:

| Issue | Ask | 💬 |
|---|---|---|
| [#459](https://github.com/streetwriters/notesnook/issues/459) | "Extensions" (the core ask) | 4 |
| [#8521](https://github.com/streetwriters/notesnook/issues/8521) | Policy of adoption / **extension support** | — |
| [#4108](https://github.com/streetwriters/notesnook/issues/4108) | tldraw plugin | 6 |
| [#2738](https://github.com/streetwriters/notesnook/issues/2738) | Excalidraw support | 6 |
| [#2559](https://github.com/streetwriters/notesnook/issues/2559) | Slash commands in editor (`good first issue`) | 5 |
| [#9467](https://github.com/streetwriters/notesnook/issues/9467) | Freehand drawing / ink annotations | 3 |
| [#4167](https://github.com/streetwriters/notesnook/issues/4167) | Spreadsheet editor | 1 |
| [#9656](https://github.com/streetwriters/notesnook/issues/9656) | "Note type" feature | — |
| [#8583](https://github.com/streetwriters/notesnook/issues/8583) / [#173](https://github.com/streetwriters/notesnook/issues/173) | Fountain support / LanguageTool | — |

Pattern: each of tldraw, Excalidraw, drawing, spreadsheet, Fountain is a *custom editor node* someone wants — exactly what an extension API turns from "Notesnook's backlog" into "community-shippable." Slash commands ([#2559](https://github.com/streetwriters/notesnook/issues/2559)) is also the natural extension **entry-point UI**.

## 3. Goal & non-goals

**Goal:** a stable, versioned public API + install/registry mechanism that lets third parties add editor nodes, marks, commands, toolbar/slash entries, input rules and keymaps — installable per-user, running on web, desktop, and mobile — without giving extensions access to other notes, plaintext at rest, encryption keys, or silent network egress.

**Non-goals (deferred, named here):**
- App-wide plugins (sidebar, sync, non-editor UI) — out of scope; editor only.
- A fully permissionless "install any JS from any URL" model (userscript-tier) — explicitly rejected for an E2EE app (§7).
- Native/binary extensions, or extensions that spawn processes (the VS Code/Zed `process:exec` model) — incompatible with the mobile WebView and the threat model.
- Marketplace monetization/payments.

## 4. Proposed solution — a two-tier model

The central finding from the research: **editor-schema code and side-effectful code have opposite isolation needs, and conflating them is the mistake.** So split the ecosystem into two tiers with different trust models.

### Tier A — Declarative / schema extensions (review-gated, in-process)
ProseMirror nodes, marks, input rules, keymaps, commands, toolbar & slash items. These **must** run synchronously inside the editor's transaction loop and manipulate live ProseMirror objects — you cannot put them behind an async `postMessage`/WASM-marshaling boundary without crippling them. Figma learned this directly: serializing a large doc across the plugin boundary "took 14 seconds… before the plugin could even run." So Tier A is **not technically sandboxed**; its safety rests on **source transparency + human review + signing + a stable API facade** (the Obsidian/Raycast model, done honestly).

To shrink the trusted surface, Tier A is **as declarative as possible**: a node's schema, rendering (a constrained, sanitized HTML/attribute template or a whitelisted render spec), input rules and keymaps are described as **data** in the manifest wherever they can be, so a large fraction of extensions (custom callouts, admonitions, colored blocks, simple wrappers, syntax) ship with **no arbitrary JS at all** and cannot be malicious. Only extensions that genuinely need imperative logic ship JS, and that JS is what review focuses on.

### Tier B — Sandboxed capability extensions (isolated, untrusted-safe)
Anything that wants **network, storage, heavy compute, or rich custom UI** (a tldraw/Excalidraw canvas, a LanguageTool call, an API-backed embed) runs in a real sandbox and never touches the host directly. Architecture (the Figma model, which is the strongest validated precedent — they tried the weaker same-VM "realms" approach first and abandoned it after live sandbox-escape exploits):

- **Logic → QuickJS compiled to WASM** (`quickjs-emscripten`). A separate JS VM with its own linear memory: the extension cannot reach the host's JS objects, DOM, `fetch`, or globals. Every capability is something the host *explicitly marshals in*. Deny-by-default. Enforced CPU-interrupt and memory limits stop runaway/DoS code.
- **UI → a null-origin `<iframe sandbox>` with a strict CSP** (`default-src 'none'; connect-src 'none'; img-src 'self' data:; script-src 'unsafe-inline'`…). Opaque origin ⇒ no cookies/localStorage/other-note DOM; `connect-src 'none'` ⇒ no network; all host interaction via `postMessage`. This is exactly Figma's UI-side design.
- **Bridge → a brokered, async, capability-scoped API** (§ below). The extension sees a *serialized transaction API* over the **current document only** — steps in, steps out — never a live `EditorView`, never a DOM node, never another note.

### The extension API surface (stable public facade over Tiptap)

Extensions never import Tiptap/ProseMirror directly (that would break every editor upgrade — cf. the pinned `@tiptap 2.6.6` / `prosemirror-view 1.34.2` in this repo). They register against a **Notesnook Editor Extension API** — a thin, versioned facade the host translates into Tiptap constructs:

```ts
export interface NotesnookExtension {
  manifest: ExtensionManifest;
  register(host: EditorHost): void | Promise<void>;
}
interface EditorHost {
  registerNode(spec: NodeSpec): void;          // → Tiptap Node.create (schema, parse/render, NodeView)
  registerMark(spec: MarkSpec): void;
  registerCommand(id: string, run: CommandFn): void;
  registerToolbarItem(item: ToolbarItemSpec): void;   // closes #2559-style UI
  registerSlashCommand(item: SlashItemSpec): void;
  registerInputRule(rule: InputRuleSpec): void;
  registerKeymap(map: Record<string, string /*commandId*/>): void;
  requestCapability(name: CapabilityName): Promise<Capability>; // Tier B only
}
```

Design rules that keep this stable across Tiptap upgrades: (a) the facade types are Notesnook's own, never re-exported Tiptap types; (b) node/mark specs are declarative data resolved by the host, not `Node.create` calls; (c) a **declared `apiVersion`** in the manifest with a compatibility range (the Open-VSX/`minAppVersion` pattern) so the host can refuse or shim mismatched extensions; (d) internal ProseMirror state, transactions, plugin keys and the `EditorView` are **never** exposed.

### Capabilities & permissions (the manifest)

Everything beyond "declare a node/mark and manipulate the current document" is a **capability** the extension must declare in its manifest and the user must grant on install. Nothing is ambient. Capabilities are async, brokered functions the host marshals across the sandbox boundary (Tier B) — the extension never gets the raw API.

```jsonc
// manifest.json
{
  "id": "acme.kanban", "name": "Kanban Board", "version": "1.2.0",
  "apiVersion": "^1.0", "tier": "B", "signature": "…",
  "permissions": ["db:read:notes", "ui:overlay", "storage"],
  "provides": { "nodes": ["kanban"], "slashCommands": ["kanban"] }
}
```

| Permission | Grants | Risk | Broker mediation |
|---|---|---|---|
| `document:write` | Edit the **current** note's content (default for editor extensions) | Low–med | Serialized transaction API; current doc only |
| `db:read:<scope>` | Query the local DB — notes/notebooks/tags/attachments metadata, and note content within `<scope>` | **Highest** — reads *other notes'* plaintext | Mediated, **projected** query API (§7); read-only; results are data, not live objects |
| `db:write:<scope>` | Create/update notes, notebooks, tags within `<scope>` | **Highest** | Goes through `packages/core` API with validation; never raw DB handles |
| `storage` | Namespaced key–value store for the extension's own state | Low | Per-extension, encrypted with the user's key, sandboxed namespace |
| `ui:overlay` | Open a full-surface editing overlay (see below) | Med | Extension UI runs only inside the strict-CSP sandbox iframe |
| `ui:panel` | A side panel / dock surface | Med | Same iframe sandbox |
| `network:<host>` | Outbound requests to an **allow-listed** host only | **High** | Host-proxied fetch; per-host allow-list; off by default; never `*` |
| `clipboard`, `notify`, `command:invoke` | Read/write clipboard on user action, toasts, invoke other registered commands | Low–med | User-gesture-gated |

`db:*` and `network:*` are the escalation permissions — they get the loudest consent UI, are only offered to signed Tier-B extensions, and are the focus of review. An extension with **neither** can do nothing worse than mangle the note the user is currently editing.

### Extension surfaces: inline NodeView + overlay

A custom node has **two rendering surfaces**, which is what makes rich extensions (drawing, diagrams, kanban) feel native:

1. **Inline NodeView** — a lightweight, **sanitized, non-interactive preview** rendered directly in the document (a rasterized/thumbnail view of the drawing, a read-only kanban summary). For Tier B this preview is produced by the extension but passed through the host's HTML/URL allow-list before it touches the real DOM (§7). It stores the node's serialized state in the node attrs (`{extensionId, version, payload}`), so the note stays self-contained and syncs normally.
2. **Overlay editor** (`ui:overlay`) — clicking the inline view calls `host.openOverlay()`, which mounts the extension's **full interactive UI inside the null-origin, strict-CSP sandbox iframe** as a modal over the editor. The user draws/edits there; on save the extension serializes its state back and the host writes it into the node attrs via the transaction API, regenerating the inline preview. The heavy, potentially-untrusted interactive code never runs in the host context — only in the sandbox — and the inline document only ever holds sanitized preview + opaque payload.

This split is exactly how a drawing extension works: a small preview in the note, a full canvas in the overlay, round-tripped through the sandbox. It also means a note containing an extension node is safe to render even when the extension is disabled — the sanitized preview (or the `extension-block` fallback, §6) shows without running any extension code.

## 5. UX per platform

- **Web / Desktop:** Settings → *Editor Extensions*: browse the registry, install/enable/disable/uninstall/update, view each extension's requested permissions and source link, and a per-extension consent dialog on install. A slash-command menu (`/`) becomes the primary in-editor entry point for extension commands.
- **Mobile (RN):** the editor already runs inside a `ReactNativeWebView` ([packages/editor-mobile/src/utils/index.ts](../../packages/editor-mobile/src/utils/index.ts), `window.ReactNativeWebView` + postMessage bridge). Extensions load **inside that WebView**, so the same web extension runs unchanged; the RN shell only gains an install/manage UI and passes the enabled-extension list + bundles across the bridge. Uses mobile design tokens + UI primitives (see project mobile conventions).
- **Editor:** custom nodes render via NodeViews; Tier B nodes render their UI inside the sandboxed iframe embedded as the NodeView. Touch/IME behavior inherits the existing WebView editor.

## 6. Data model & sync

- **Installed-extensions list** is per-user config: `{ id, version, enabled, grantedPermissions[], source, signature }`. It should **sync** (encrypted, like other user settings) so a user's extension set follows them across devices — but **extension code bundles are fetched from the registry per-device on demand**, not synced through Notesnook's servers (the server must never become a code-distribution or content-touching path).
- **Extension-authored document content** is just ProseMirror nodes in the note — already encrypted and synced by the existing pipeline. Custom nodes must **degrade gracefully**: a note containing a `tldraw` node opened on a device without that extension must render a safe placeholder (stored serialized attrs + a "install X to view" fallback), never data-loss or a crash. This requires the schema to permit unknown-but-preserved nodes (a generic `extension-block` wrapper storing `{extensionId, version, payload}`).
- **Migration:** the built-in extensions move behind the same registry (§10 Phase 1) — a pure refactor, no note-data migration. The `extension-block` fallback node is a forward-compatible schema addition.
- **Conflict/multi-device:** enabling an extension on device A syncs the intent; device B fetches the bundle on next open. Version skew is handled by the `apiVersion` gate and the graceful-placeholder fallback.

## 7. Encryption & privacy — the hard part, stated honestly

The zero-knowledge guarantee is the whole point, and it constrains this feature more than any other:

- **The server never sees plaintext or extension-produced content in the clear.** Extension bundles are distributed from the registry (a separate, public system — §8/§11), never through Notesnook's sync/content servers. Note content authored by extensions rides the existing E2EE pipeline unchanged.
- **Tier A honesty:** in-process schema extensions are *trusted code*. A malicious Tier A extension **can** read the current document and, if it has DOM access, potentially more. That is why Tier A is gated by review + signing + source transparency and is **not** advertised as sandboxed. This is a deliberate, disclosed tradeoff (the Obsidian model), acceptable only because Tier A is review-gated and kept as declarative as possible.
- **Tier B guarantee and its limit:** the QuickJS-VM + null-origin-iframe + deny-by-default-bridge stack means a Tier B extension has **no ambient `fetch`, no DOM, no host objects, no other notes** — it sees only the current document via a mediated transaction API and only the capabilities the user granted. **But** — the irreducible residue the research surfaced: *a plugin that can both read the document and render anything the user can act on can try to socially-engineer a leak.* Even with `connect-src 'none'`, rendered output can smuggle plaintext into an `<img src>`/background-image URL (the browser makes the request) or into a clickable link/clipboard/`<a download>`. Mitigations: lock the iframe CSP to `img-src 'self' data:; font-src 'none'; connect-src 'none'`, **sanitize and allow-list every DOM node/URL/attribute** an extension emits, and treat every outbound network/navigation/clipboard action as an **explicit, host-mediated, user-consented capability** — never silent. This reduces exfiltration to "requires a visible user action"; it does not reduce it to zero while extensions render interactive UI over plaintext. This limit must be documented, not hidden.

- **Database access (`db:read`/`db:write`) — the highest-risk capability, and why it's mediated, not raw.** Extensions like Dataview/Kanban/Calendar are only possible if an extension can query the vault and render results in the editor. But the local DB (`packages/core`) holds the **decrypted plaintext of every note** — so `db:read` escalates the blast radius from "the current note" to "the whole vault." This is allowed, but never as raw DB access. The broker exposes a **projected, capability-scoped query API**, not the database:
  - **Reads are queries, not handles.** The extension asks for `db.query({ type: 'note', where: {...}, select: [...], scope })` and gets back plain serialized data — never live `core` objects, never a cursor it can walk arbitrarily. `scope` narrows to a notebook/tag the user consented to (`db:read:notes` vs `db:read:notebook/<id>`), so "read my whole vault" and "read this one notebook" are different grants with different consent.
  - **Writes go through validated `core` commands** (`db.createNote`, `db.addToNotebook`, …) with the same rules the app enforces — never direct table writes, never touching encryption keys, sync state, or other users' shared content.
  - **The sandbox still contains it.** A `db:read` extension can *compute over* vault data but, with no `network:*` grant, cannot send it anywhere — the QuickJS VM has no `fetch`. The residual is the same read-and-render social-engineering vector as above, now over more data, which is exactly why `db:read` + rendering carries the strongest consent UI, is Tier-B-and-signed only, and is the primary focus of extension review. An extension that renders DB content should, by default, render it through the same sanitized-preview path as any other node.
  - **Keys and ciphertext are never exposed.** No capability grants raw ciphertext, key material, or the sync transport. Extensions operate one layer above encryption, on already-decrypted data the user's client already holds.

## 8. Server / API changes

- **No changes to Notesnook's content/sync/identity servers** — a hard requirement. They stay content-blind.
- A **separate Extension Registry service** (§11): serves the catalog (metadata, versions, signatures, source links) and the bundles. It is public, holds no user notes, and is independently self-hostable. Modeled on Open VSX (vendor-neutral, self-hostable) rather than a Notesnook-server endpoint, precisely to keep it off the E2EE path.

## 9. Dependencies & licensing

- `quickjs-emscripten` (MIT) — Tier B logic VM. ~500 KB–1 MB WASM payload, lazy-loaded only when a Tier B extension is enabled.
- Optionally SES/`ses` (Apache-2.0) for **capability-policy discipline + host-side prototype-pollution hardening** (MetaMask-proven) — layered, not the sole boundary.
- A registry service (self-hostable; Open-VSX-style stack). All GPLv3-compatible; all self-host-friendly. No proprietary SDKs.

## 10. Implementation plan (phased)

**Phase 1 — Dynamic registry refactor (internal, no third-party code). The de-risking phase.**
- Replace the static `getExtensions()` array in [packages/editor/src/index.ts](../../packages/editor/src/index.ts) and the static `tools` map in [packages/editor/src/toolbar/tools/index.ts:108](../../packages/editor/src/toolbar/tools/index.ts#L108) with an **ExtensionHost registry** that merges built-in + installed extensions at editor-construction time.
- Migrate 2–3 existing built-ins (e.g. `callout`, `math`) to the new public facade to prove the API is expressive enough. Add the `extension-block` graceful-fallback node.
- Ship the stable `EditorHost` facade + `apiVersion`. **No user-facing feature yet** — pure architecture, fully testable.

**Phase 2 — Tier A: curated/trusted extensions (review + signing).**
- Manifest format, install/enable/disable/uninstall/update lifecycle, per-platform manage UI, sync of the installed-list.
- Registry (Phase-2 minimal: a signed, source-transparent catalog; start curated/first-party + vetted contributors, Raycast-style GitHub-PR governance). Signing via minisign or CI/Sigstore provenance; 2FA on publish.
- Declarative node/mark/input-rule support so many extensions need **zero** arbitrary JS. Ships the headline "bring your own editor node" value.

**Phase 3 — Tier B: the sandbox.**
- QuickJS-in-WASM logic host + null-origin strict-CSP iframe UI + brokered capability API (§ below). Capability/permission model, consent dialogs, per-capability CSP.
- Port one flagship untrusted-capable extension end-to-end (a drawing/tldraw-style node or a LanguageTool integration) as the proof.

**Phase 4 — Distribution maturity.**
- Open community submission at scale, transparent ownership claims, malware scanning + cooldown/delayed-publish windows, self-host registry docs, reactive takedown + forced-disable on the client.

Riskiest phase: **Phase 3** (the sandbox correctness). Phase 1 is the cheapest, highest-leverage step and should ship regardless of whether the ecosystem ever opens publicly.

## 11. Distribution & trust

- **Model:** an Open-VSX-style vendor-neutral, **self-hostable** registry with **Raycast-style GitHub-PR governance** (all extension source public, human-reviewed before listing — trust from *source visibility*, not just a signature). This fits a small team and self-hosters better than a closed store.
- **Signing & provenance:** sign releases (minisign Ed25519 keypair, or Sigstore keyless build-provenance from CI so there's no long-lived key to guard). **2FA mandatory on publish accounts** — the two canonical npm compromises (event-stream, ua-parser-js) were maintainer-account/handoff attacks, which 2FA + provenance directly counter. Add **cooldown windows** before a new version becomes the default install (fast-moving live malware relied on instant propagation).
- **Trust posture, disclosed:** Tier B extensions run sandboxed; Tier A extensions run trusted-after-review with a clear "runs with editor privileges" consent — mirroring Obsidian's honest warning, but narrower because Notesnook adds signing + a real sandbox tier + graceful client-side disable/removal.
- **Reactive controls:** report → review → **remove from registry + push a client-side disable/quarantine** (removal alone doesn't uninstall existing copies — Chrome/VS Code both hit this; the client must be able to force-disable a flagged extension).

## 12. Cross-platform reality

The whole editor is one web codebase running in three shells: a browser (web), Chromium (Electron desktop), and a `ReactNativeWebView` (mobile). **The same extension runs on all three unchanged**, because every isolation primitive chosen — QuickJS-WASM, `<iframe sandbox>` + CSP, postMessage — works identically in browser, Electron, and RN WebView. This is the decisive reason to prefer QuickJS-in-WASM over process-isolation (VS Code) or native WASI hosts (Zed): those don't exist inside the mobile WebView. Caveat: the WASM payload (~1 MB) is only fetched when a Tier B extension is enabled, so users who install none pay nothing.

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Plaintext exfiltration via a malicious extension | Tier B sandbox (VM + null-origin iframe + `connect-src 'none'`); Tier A review+signing; capability consent; §7 residual disclosed |
| `db:read` widens blast radius to the whole vault | Projected query API (no raw handles); scoped grants (`db:read:notebook/<id>` vs `:notes`); loudest consent; signed-Tier-B-only; sandbox blocks egress without a separate `network:` grant; render via sanitized path |
| Read-and-render social-engineering leak | Lock CSP `img-src`/`font-src`/`connect-src`; sanitize/allow-list all emitted DOM & URLs; user-consented network/nav/clipboard only |
| Tiptap/ProseMirror upgrade breaks all extensions | Stable Notesnook facade (never re-export Tiptap types); `apiVersion` compat gate; declarative specs |
| Malicious/compromised publisher | Public source + review, mandatory 2FA, build provenance, publish cooldown, forced client-disable |
| Note becomes unreadable without an extension | `extension-block` graceful-fallback node preserving payload + "install to view" |
| Sandbox correctness bugs (the expensive kind) | Ship Phase 1–2 without Tier B; adopt Figma's proven separate-VM design; security review + external audit before Phase 3 GA |
| Perf: QuickJS ~10× slower + WASM payload | Tier B only for side-effectful extensions; lazy-load WASM; keep schema extensions in fast Tier A |
| Small-team ops burden of a registry | Start curated + GitHub-PR governance; self-host-first; scale review only as volume grows |

## 14. Success metrics

- Phase 1: all built-in editor extensions run through the registry with no regression (internal).
- Phase 2: first ≥5 community Tier-A extensions published; ≥1 previously-backlogged node (e.g. a callout variant) shipped by a non-maintainer.
- Phase 3: tldraw/Excalidraw ([#4108](https://github.com/streetwriters/notesnook/issues/4108)/[#2738](https://github.com/streetwriters/notesnook/issues/2738)) or drawing ([#9467](https://github.com/streetwriters/notesnook/issues/9467)) shipped as a sandboxed extension, not first-party code.
- Long-run: reduction in "please add X editor feature" issues resolvable by "there's an extension for that"; closure of [#459](https://github.com/streetwriters/notesnook/issues/459)/[#8521](https://github.com/streetwriters/notesnook/issues/8521)/[#2559](https://github.com/streetwriters/notesnook/issues/2559).

## 15. Feasibility

```
VERDICT: RESHAPE (phased, two-tier)
Possible:  Yes — but a single "install arbitrary untrusted JS" marketplace is NOT
           possible under zero-knowledge without leaking plaintext. Possible only
           when split into (A) review-gated in-process schema extensions and
           (B) QuickJS-WASM + null-origin-iframe sandboxed capability extensions.
Worth it:  High demand (tldraw/Excalidraw/drawing/slash/spreadsheet + explicit
           "extensions" asks, multi-year) vs. large, security-critical cost
           concentrated in the sandbox. Worth it BECAUSE it's phased: Phase 1–2
           deliver most value at contained cost; Phase 3 (the expensive sandbox)
           is gated behind an audit and only needed for network/UI extensions.
Shape:     As-proposed is wrong (one untrusted-JS store). Right shape = two tiers
           + phased rollout; Tier A as declarative-as-possible to minimize the
           trusted-code surface; the E2EE residual disclosed, not hidden.
Demand:    #459, #8521, #4108 (6💬), #2738 (6💬), #2559 (5💬), #9467 (3💬),
           #4167, #9656, #8583, #173 — sustained across years.
Reasoning: Editor extensibility is genuinely wanted and technically feasible, but
           the naive form is incompatible with the threat model and too heavy for
           a small team at once. The two-tier + phased design ships real value in
           Phase 1–2 (a stable API + curated, signed, review-gated extensions) and
           defers the hard, audit-worthy sandbox to Phase 3 where it's actually
           required. Refuse to ship Tier B without a security audit.
Dropped-if: Team cannot commit to ongoing registry review + a Phase-3 security
           audit → ship Phase 1 (internal refactor) + Phase 2 curated-only, and
           stop there rather than open untrusted submission.
```

### Method note
Synthesized from primary-source research on VS Code, Obsidian, Figma (the decisive precedent — same-VM realms tried and abandoned for QuickJS-WASM), ShadowRealm (TC39, explicitly "not a security boundary"), SES/Compartments/LavaMoat/MetaMask Snaps, quickjs-emscripten, Web Workers/Comlink, iframe-sandbox+CSP, WASI/Component-Model/Extism/Zed, and governance/signing models (Open VSX, Raycast, Chrome Web Store, userscripts, sigstore/minisign/SLSA, npm supply-chain incidents). Editor-architecture claims verified against this repo's `packages/editor` and `packages/editor-mobile`.

---

## Appendix A — Ten complex extensions that drop into this API

Each maps to a tier, the capabilities it declares, and the surfaces it uses (inline NodeView + overlay, panel, slash command). Together they exercise the whole API — declarative nodes, sandboxed logic, DB access, overlays, and allow-listed network.

| # | Extension | Tier | Permissions | Surfaces & how it works |
|---|---|---|---|---|
| 1 | **Drawing / whiteboard** (tldraw/Excalidraw-style) — [#4108](https://github.com/streetwriters/notesnook/issues/4108), [#2738](https://github.com/streetwriters/notesnook/issues/2738), [#9467](https://github.com/streetwriters/notesnook/issues/9467) | B | `ui:overlay`, `storage` | Inline NodeView shows a rasterized preview; click → **overlay** hosts the full canvas in the sandbox iframe; on save, serialized scene → node attrs, PNG/SVG preview regenerated. The flagship overlay case. |
| 2 | **Dataview-style query block** | B | `db:read:notes` | A ```` ```query ```` node; the sandbox runs the query against the **projected DB API** and renders a sanitized table/list of matching notes inline. Live-updates when the DB changes. The flagship `db:read` case. |
| 3 | **Kanban board** | B | `db:read:notes`, `db:write:notes`, `ui:overlay` | Inline board preview; overlay for drag-and-drop editing; columns are backed by a notebook/tag, cards are notes — moving a card is a validated `db.write`. |
| 4 | **Diagram-as-code** (Mermaid/PlantUML/Graphviz) | B | none (offline) or `network:<render-host>` | Fenced code node; QuickJS runs the renderer (Mermaid is pure JS → no network) and emits sanitized SVG inline; overlay for a live-edit split view. |
| 5 | **Spreadsheet / data grid** — [#4167](https://github.com/streetwriters/notesnook/issues/4167) | B | `ui:overlay`, `storage` | Inline table preview; overlay for a full grid with formulas; state serialized into node attrs. |
| 6 | **Callout / admonition pack** (Admonition-style) | **A** | none | Purely **declarative** nodes + input rules + toolbar items — no JS. The proof that a big class of extensions needs no sandbox at all. |
| 7 | **Code runner** (sandboxed JS/Python-via-WASM) | B | `ui:panel` | Runs a code node's contents inside its own QuickJS/WASM and shows output in a panel — deny-by-default, no network unless granted. |
| 8 | **Citation / reference manager** (Zotero-style) | B | `db:read`, `network:api.zotero.org`, `ui:overlay` | Slash command opens an overlay to search a library over the allow-listed host; inserts a citation mark + builds a bibliography node from `db:read`. |
| 9 | **AI writing assistant** (Smart Connections/Copilot-style) | B | `network:<model-host>`, `document:write`, optional `db:read` | Panel/overlay; sends **only the selection or current note** (never silent, never whole vault) to an allow-listed model host; streams edits back through the transaction API. Network + consent are explicit. |
| 10 | **Spaced-repetition / flashcards** — [#8556](https://github.com/streetwriters/notesnook/issues/8556) | B | `db:read`, `db:write`, `storage`, `ui:overlay` | Declarative `::cloze::` mark + a review overlay; scheduling state in `storage`; pulls due cards across the vault via `db:read`. |

## Appendix B — Porting the top 10 Obsidian community plugins

The most-downloaded Obsidian plugins ([obsidianstats.com/most-downloaded](https://www.obsidianstats.com/most-downloaded), [dsebastien.net 2026 list](https://www.dsebastien.net/the-must-have-obsidian-plugins-for-2026/)) and what each needs here. The recurring theme: Obsidian gives plugins full Node/vault access so it never had to design capabilities — porting them to Notesnook means expressing each plugin's *actual* needs as scoped permissions, which is the whole point.

| Obsidian plugin (~downloads) | What it does | Tier | Permissions needed | Portability |
|---|---|---|---|---|
| **Dataview** (~3.7M) | Query vault as a DB, render tables/lists in notes | B | `db:read:*` | **High** — maps directly to the projected query API (ex. #2). The query language is the work. |
| **Excalidraw** | Full drawing canvas, embed in notes | B | `ui:overlay`, `storage` | **High** — the canonical overlay case (ex. #1). Excalidraw is MIT + web-based. |
| **Templater** | Dynamic templates with JS + variables | B | `document:write`, optional `db:read`, `storage` | **Medium** — template engine runs in QuickJS; system/shell commands Obsidian allows are intentionally **not** portable (blocked by threat model). |
| **Tasks** | Query/manage task items across the vault | B | `db:read:notes`, `db:write:notes` | **High** — declarative task mark + query; a natural fit given existing checklist nodes. |
| **Advanced Tables** | Table navigation/formatting/formulas | **A** | none | **Very high** — input rules + keymaps + commands over the existing table node; mostly declarative, no sandbox. |
| **Kanban** | Board view backed by markdown | B | `db:read/write:notes`, `ui:overlay` | **High** — ex. #3. |
| **Calendar / Periodic Notes** | Calendar UI, daily/periodic notes | B | `db:read/write:notes`, `ui:panel` | **High** — panel + DB writes to create/open dated notes. |
| **Admonition** | Callout blocks with icons | **A** | none | **Very high** — Notesnook already has a `callout` node; this is a declarative pack (ex. #6). |
| **Style Settings** | User-tweakable CSS variables for themes | **A** | (theming hook) | **Medium** — needs a **scoped, sanitized** theming surface (allow-listed CSS custom properties only — never arbitrary CSS, which is an injection/exfiltration vector). A constrained variant is portable. |
| **QuickAdd / Outliner** | Capture macros / outline editing | B (QuickAdd) / **A** (Outliner) | `db:write`, `command:invoke` / none | **High** — Outliner is keymaps/commands over lists (declarative); QuickAdd is macros needing scoped `db:write`. |

Two honest limits surfaced by the port analysis: (1) plugins that rely on Obsidian's **arbitrary Node/filesystem/shell access** (Git, Remotely Save, anything shelling out, Templater's system commands) **cannot** port faithfully — that capability doesn't and shouldn't exist here; the closest Notesnook equivalents are first-party (sync already exists). (2) Anything wanting **arbitrary CSS injection** (parts of Style Settings, some theme plugins) must be reduced to an allow-listed variable surface, because raw CSS can exfiltrate via `background: url(...)`. Both are consequences of the E2EE/zero-ambient-authority stance, not gaps to be closed.
