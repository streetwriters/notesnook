# Proof: apps/web on `@notesnook/ui-kit`

Throwaway branch `docket/5-3-web-on-kit-proof` (commit 872863230, on top of 4b2b511c2), made with `node tools/web-kit-proof/index.mjs switch`. Never merged.

## Diff size

`node tools/web-kit-proof/index.mjs report 4b2b511c2 872863230`:

- 116 files changed, 124 lines added, 124 removed.
- Changes outside import statements: **0**.

The zero is only the textual result: no fixes were made on the branch, and the type-check below shows that apps/web does **not** compile against the kit as it stands. The changes it would need are listed as exceptions.

## Type-check

`tsc -p apps/web` mixes @types/react 18 (apps/web) and 19 (packages/ui) and fails 371 times before any change, so both runs used a scratch tsconfig that maps `react` to one copy of the types.

| | errors |
|---|---|
| baseline (4b2b511c2) | 55 |
| proof (872863230) | 427 |
| new on the proof | 372, in 70 files |

## Exceptions: non-import changes the switch needs

Grouped by cause. Each is either a fix in apps/web or a widening of the kit's types; neither was made, so the proof is **not** an imports-only switch yet.

| Cause | Errors | Reason | Fix |
|---|---|---|---|
| Lengths/spacing given as strings in `sx` (`"100%"`, `"1px"`, `"auto"`) | 59 | kit `sx` types lengths as numbers/tokens | widen kit length type to accept CSS strings |
| Colours that aren't theme tokens (`"transparent"`, hex, `var(--…)`) | 43 | kit colour type is token-only | accept CSS colour strings |
| `sx` keys the kit doesn't know | 28 | kit's key set is the desktop-drawable subset | add keys or ignore them on desktop |
| theme-ui `ThemeUIStyleObject` values passed into `sx` | 28 | different type | kit to accept theme-ui's style type on web, or change call sites |
| `display` other than `flex`/`none` | 12 | desktop draws only flex | accept on web, ignore on desktop |
| transition/border/flex shorthand strings | ~20 | kit has no shorthands | parse or widen |
| Event and ref shapes (`UIElement`, kit mouse/drag types vs DOM) | 18 | kit events aren't DOM events | type web kit events as DOM events |
| Menu-item icon types and variant names, mostly downstream of the `sx` type | ~49 | follow from the above | revisit after the widening |

## Web e2e

Playwright, Chromium, apps/web's config with 4 workers and a 15 s test timeout, against a production build of each commit served locally. Specs: notes, notebooks, tags, colors, trash, search, navigation, reminders (plus keyboard-list-navigation, which the `notes.test.ts` filter also matches): 114 tests in 9 files.

| | passed | failed |
|---|---|---|
| baseline (4b2b511c2) | 69 | 45 |
| proof (872863230) | 72 | 42 |

**No test fails on the proof that passes on the baseline.** The proof's 42 failures are a subset of the baseline's 45; the 3 baseline-only ones (`notes.test.ts` › unpin / assign a color / lock a note using properties) are flaky timeouts. Every failure on both is a `locator.waitFor` timeout, and they cluster in keyboard-list-navigation (16) and notebooks (18), so they come from the shortened timeout and the environment, not the switch.

The full suite (219 tests) was not run to the end: those runs were stopped at the user's request.
