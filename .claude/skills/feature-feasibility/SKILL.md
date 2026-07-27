---
name: feature-feasibility
description: >
  Scoring rubric and go/no-go framework for deciding whether a proposed Notesnook
  feature should be BUILT, RESHAPED, or DROPPED. Use it during the feasibility
  gate of feature design — after demand and technical research are gathered,
  before any implementation plan is written. Produces an auditable verdict.
---

# Feature Feasibility Rubric

Reach one of three verdicts — **BUILD**, **RESHAPE**, or **DROP** — by answering
the three gates in order. A hard failure at any gate ends the evaluation; do not
carry a doomed idea into design.

## Gate 1 — Is it POSSIBLE? (hard constraints)

Any "no" here is disqualifying unless the feature is redesigned to avoid it.

- **Zero-knowledge safe?** Does it work without the server ever seeing plaintext?
  If it needs server-side access to note content (search, AI, rendering,
  dedup, analytics over bodies), it is impossible as-server-side and must run
  client-side or be dropped. This is the number-one killer — check it first.
- **Encryption-compatible?** Does it fit the existing crypto model, or does it
  require new key material, re-encryption of existing data, or weakening the
  threat model?
- **Sync-expressible?** If it adds or changes syncable data, can it survive
  offline edits, multi-device merge conflicts, and a forward/back migration?
- **Platform-reachable?** Is the capability available on web, Electron, AND the
  RN/WebView editor — or is it fundamentally one-platform (and is that
  acceptable)?
- **License-clean?** Any new dependency/service compatible with GPLv3 and with
  self-hosting?

## Gate 2 — Is it WORTH IT? (value vs. cost)

Score each 1–5, note the number, don't just vibe.

**Value**
- Demand: how many independent requests / 👍 / recurring threads? (cite issues)
- Job importance: core note-taking job, or a nice-to-have at the edge?
- Differentiation vs. retention: does it win or keep users?

**Cost**
- Engineering size: touch-points across packages/apps (list them).
- Surface-area risk: does it complicate sync, crypto, the editor, or migrations
  — the areas where bugs are expensive and data-loss-prone?
- Maintenance tail: ongoing burden, new failure modes, support load.
- Parity multiplier: cost × number of platforms that must implement it.

**Heuristic:** high demand + core job + contained cost → strong BUILD. High cost
concentrated in sync/crypto/editor needs proportionally higher value to justify.
Low demand + high cost → DROP regardless of coolness.

## Gate 3 — Is it the RIGHT SHAPE?

- Is there a smaller version that delivers 80% of the value at 20% of the cost?
  If so, that is the real proposal → **RESHAPE**.
- Is it better solved outside the app (existing integration, plugin, docs,
  a setting that already exists)? → **DROP** with the pointer.
- Does it fit Notesnook's product identity (privacy, calm, no bloat), or is it
  feature-creep that belongs in a different product?

## Verdict format

Emit this block verbatim in the spec / memo:

```
VERDICT: BUILD | RESHAPE | DROP
Possible:  <yes/no + the binding constraint>
Worth it:  <value score vs cost score, one line>
Shape:     <as-proposed | the reshaped form | why it should not exist>
Demand:    <#issues, 👍, key threads>
Reasoning: <2–4 sentences an engineer/PM can audit>
If RESHAPE: <the version that passes>
If DROP:    <the cheapest thing to do instead, if anything>
```

A DROP with clear reasoning is a successful evaluation, not a failure. The goal
is a correct decision, not a green light.
