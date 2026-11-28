# Proof: apps/web on `@notesnook/ui-kit`

Throwaway branch `docket/5-3-web-on-kit-proof` (commit 872863230, on top of 4b2b511c2), made with `node tools/web-kit-proof/index.mjs switch`. Never merged.

## Diff size

`node tools/web-kit-proof/index.mjs report 4b2b511c2 872863230`:

- 116 files changed, 124 lines added, 124 removed.
- Changes outside import statements: **0**.

The zero is the textual result: no fixes were made on the branch. When the proof was first run apps/web did not compile against the kit; it does now, with no change in apps/web (see the type-check below).

## Type-check

`node tools/web-kit-proof/index.mjs typecheck` copies apps/web next to itself, switches the copy's imports and type-checks it before and after. `tsc -p apps/web` mixes @types/react 18 (apps/web) and 19 (packages/ui) and fails before any change, so both runs map `react` to apps/web's one copy of the types. An error is new when the baseline has fewer errors with the same file and code.

| | errors | new on the switch |
|---|---|---|
| first proof (872863230, kit as of 4b2b511c2) | 427 | 372, in 70 files |
| now | 180, the same as the baseline | **0** |

The baseline count depends on what is built in the checkout (the errors are apps/web's own: missing `@notesnook/editor` types, the desktop tRPC bridge types, implicit `any`s). It was 55 for the first proof and is 180 in a checkout with only desktop-native's packages built; the switch adds nothing to either.

No change was made in apps/web. Each cause from the first proof, and what the kit changed:

| Cause (errors then) | What changed in the kit | Errors now |
|---|---|---|
| Lengths and spacing as strings in `sx`: `"100%"`, `"1px"`, `"auto"`, rem (59) | `SxProp` is built on theme-ui's own style type (`contracts/style.ts`), so every CSS value type-checks; desktop draws px, %, vw/vh and rem/em | 0 |
| Colours that aren't theme tokens: `"transparent"`, hex, `var(--…)` (43) | the same type: a colour is a token or any CSS colour string | 0 |
| `sx` keys the kit didn't know: selectors, grid, scroll snapping (28) | the same type: every CSS property and nested selector is a key. Desktop matches selectors that name a tag, class or id below, and ignores the rest | 0 |
| theme-ui `ThemeUIStyleObject` values passed into `sx` (28) | theme-ui's object and its function-of-the-theme form are assignable to the kit's `sx` (`SxStyle`); desktop calls the function with the theme | 0 |
| `display` other than `flex`/`none` (12) | accepted; desktop lays out `grid`, `block` and the rest as the default column | 0 |
| Shorthand strings: `transition`, `animation`, `flex`, `border` (~20) | accepted; desktop parses the `transition` and `animation` shorthands (keyframes from the kit's `keyframes` tag or a `<style>` element) | 0 |
| Event and ref shapes: `UIElement` and kit events vs DOM (18) | on the web the kit's elements are typed as what they are, theme-ui's components: DOM events, DOM element refs, theme-ui's props (`web/primitives.tsx`). The contract, which desktop compiles against, keeps the kit's DOM-shaped events | 0 |
| Menu-item icon types and variant names (~49) | followed from the `sx` type; variants take any name, as theme-ui's do | 0 |

What the zero does not show: it is a type-check. That desktop draws what the wider type lets through is checked separately, by the kit's unit tests and by running the app (the Wrapped and Plans views are apps/web's files and were opened in the desktop app); `docs/ui-kit-web-api.md` lists what desktop draws of `sx` and what it ignores.

## Web e2e

Playwright, Chromium, apps/web's config with 4 workers and a 15 s test timeout, against a production build of each commit served locally. Specs: notes, notebooks, tags, colors, trash, search, navigation, reminders (plus keyboard-list-navigation, which the `notes.test.ts` filter also matches): 114 tests in 9 files.

| | passed | failed |
|---|---|---|
| baseline (4b2b511c2) | 69 | 45 |
| proof (872863230) | 72 | 42 |

**No test fails on the proof that passes on the baseline.** The proof's 42 failures are a subset of the baseline's 45; the 3 baseline-only ones (`notes.test.ts` › unpin / assign a color / lock a note using properties) are flaky timeouts. Every failure on both is a `locator.waitFor` timeout, and they cluster in keyboard-list-navigation (16) and notebooks (18), so they come from the shortened timeout and the environment, not the switch.

The full suite (219 tests) was not run to the end: those runs were stopped at the user's request.
