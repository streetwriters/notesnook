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

**No usable result.** Full Playwright runs on baseline and proof were stopped at the user's request before finishing (empty JSON reports). At the stop each had about 54 failures, nearly all the same tests, already failing on the baseline ("Could not unwrap key", the login page); the one difference was an editor autosave test that failed only on the baseline. A follow-up 8-spec rerun matched no files (`No tests found`) and ran nothing. So nothing shows the app still works after the switch.
