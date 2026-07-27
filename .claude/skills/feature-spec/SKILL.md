---
name: feature-spec
description: >
  The implementation-plan template and quality bar for a Notesnook feature spec.
  Use it when writing up a feature that passed the feasibility gate, so the
  output is complete enough for an engineer to implement with zero open
  questions. Write the result to docs/features/<kebab-name>.md.
---

# Feature Spec Template

Fill every section. Omit a section only by writing "N/A — <reason>". If you
cannot fill a section because you don't know, that is unfinished research, not an
optional field — go find out. Cite code as `path:line` and facts as links.

```markdown
# <Feature name>

> Status: Proposed · Author: feature-architect · Date: <YYYY-MM-DD>
> Verdict: <BUILD | RESHAPE> (see Feasibility below)

## 1. Problem
Who hurts, the job they're doing, why now. One paragraph, concrete.

## 2. Demand evidence
Issues this addresses (with counts / 👍), key quotes, any prior rejected
attempts and why they died. Numbers, not adjectives.

## 3. Goal & non-goals
- Goal: the single job this delivers.
- Non-goals: what this explicitly does NOT do (deferred scope named here).

## 4. Proposed solution
The design in prose + a diagram/flow if it helps. The smallest version that
delivers the goal.

## 5. UX per platform
- Web / Desktop: <flows, entry points, states>
- Mobile (RN): <flows; note design-token + UI-primitive usage>
- Editor (if applicable): <ProseMirror node/mark/extension behavior; mobile
  WebView / touch / IME implications>

## 6. Data model & sync
- New/changed entities and fields.
- Migration: forward + backward, and how existing data is handled.
- Conflict & multi-device behavior: what happens on concurrent edits offline.
- N/A only if genuinely no persisted state changes.

## 7. Encryption & privacy
- What new data is stored and how it stays end-to-end encrypted.
- Confirmation the server never needs plaintext (or the explicit exception and
  its justification).

## 8. Server / API changes
Endpoints or none. Each one justified against the zero-knowledge model. N/A if
fully client-side (state that).

## 9. Dependencies & licensing
New libraries/services, versions, license, self-host compatibility. N/A if none.

## 10. Implementation plan (phased)
Ordered phases, each with concrete tasks and the files they touch (`path:line`).
Each phase independently reviewable. Call out the risky phase.

## 11. Edge cases & failure modes
The list that separates a real spec from a wish. Empty note, huge note, offline,
mid-sync, permission denied, platform-missing-capability, migration on old data.

## 12. Acceptance criteria
Testable checklist. "Done" is unambiguous. Include the per-platform matrix.

## 13. Risks & mitigations
Each risk with a concrete mitigation or a spike to de-risk it first.

## 14. Success metrics
How you'll know it worked (adoption, reduced support load, closed issues).

## 15. Feasibility
Paste the VERDICT block from the feature-feasibility skill.
```

## Quality bar (self-check before finishing)
- Could an engineer implement this without asking you a single question? If not,
  the gap is your next research task.
- Is every code reference a real `path:line` you verified?
- Is every "users want this" backed by an issue number?
- Are sync, crypto, and migration addressed (or honestly marked N/A)?
- Is deferred scope named, so the reviewer isn't surprised?
- Does the plan scale to the idea — not over-engineered, not hand-wavy?
