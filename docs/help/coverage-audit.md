# Help documentation coverage audit

Notesnook **3.4.x** · help site **93 pages** · last run 2026-08-01.

Method: mechanical sweeps over the whole `contents/` tree, plus targeted verification of every load-bearing claim against the monorepo source (`packages/common/src/utils/is-feature-available.ts`, `packages/crypto/src/`, `packages/theme/src/theme-engine/types.ts`, `packages/intl/src/strings.ts`, `apps/web/src/`, `apps/mobile/app/`).

## Where it stands

| | |
| --- | --- |
| Pages | 93 |
| Orphan pages / dead sidebar links | 0 / 0 |
| Pages with a meta description | 93 / 93 |
| Pages with `pageTitle` and `keywords` | 91 / 93 (`404`, `index` excluded) |
| Pages ending in a `## Related pages` cluster | 90 / 90 (`404`, `docs`, `index` excluded) |
| Internal links in body content | ~810 |
| Gated features (35) documented | 35 / 35 |
| Structured data | BreadcrumbList + TechArticle on all 93; HowTo on 57; FAQPage on 13 |
| Images with descriptive alt text | 100% |
| Outstanding screenshot TODOs | 24 |
| `npm run build` | passes — 0 dead internal links, 0 unresolved string keys |
| Legacy URLs still resolving | 71 / 71 (8 section indexes now 301) |

## Verified against source this run

These were re-derived from the source rather than taken on trust:

| Claim | Source | Result |
| --- | --- | --- |
| All plan limits and every gated feature | `is-feature-available.ts` | 35 / 35 correct |
| All 35 `<PlanTag>` placements | `is-feature-available.ts` | all correct |
| Trash cleanup default of 7 days | `packages/core/src/collections/settings.ts:65` | correct |
| 297 code-block languages | `packages/editor/.../languages.json` | correct |
| Encryption primitives | `packages/crypto/src/` | corrected — see below |
| Theme scopes / variants / colors | `packages/theme/src/theme-engine/types.ts` | corrected — see below |
| Refund windows | `apps/web/src/dialogs/buy-dialog/plans.ts` | 7 / 14 / 30 days, now documented |
| Keyboard shortcut registry | `packages/common/src/utils/keybindings.ts` | page regenerates with zero diff |

## Source bugs from earlier audits — all fixed in the app

The four app-side bugs earlier runs surfaced have since been fixed in the source, and `keyboard-shortcuts.md` regenerates with **no diff**:

| Bug | Status |
| --- | --- |
| `strings.none()` returned `"Cell border width"` | fixed — returns `None` |
| `strings.alignCenter()` returned `"Alignment"` | fixed — returns `Align center` |
| `sinkListItem` bound to `Mod-Shift-Down` | fixed — page reads `Tab` |
| Font-size shortcuts inverted, and `Ctrl-` macified on Mac | fixed — registry uses `Mod-[` / `Mod-]`, and `font-size.ts` binds from `tiptapKeys`, so labels and handlers cannot disagree |

There are no known outstanding source-side bugs affecting the docs.

## Errors found and fixed in this run

**Contradictions and wrong facts**

- `plans-and-limits.md` referred to a refund "window listed above" that was never stated. The real windows (7 / 14 / 30 days by billing period) are now documented in their own section and in the FAQ schema.
- Regional pricing was described as Pro-only in the body and as all-plans in the FAQPage schema. Both now say the same verifiable thing.
- The flat "all plans have a 14-day free trial" claim was not verifiable — trial length is server-driven and passed into `trialPlanConditions(duration)`. The page now says the length is shown on the plan before you start it.
- `attachments-and-files.md` and `trash.md` gave three different answers to "does deleting attachments free storage". All three now describe storage as a monthly allowance, consistent with the `50MB/mo` captions in `is-feature-available.ts`. **See open questions below.**
- `rich-text-editor-toolbar.md` said toolbar config "is automatically synced across all your devices" and then that it is not.
- `how-is-my-data-encrypted.md` named the cipher "XChaCha-Poly1305-IETF" (it is XChaCha**20**-Poly1305-IETF, `crypto_aead_xchacha20poly1305_ietf`) and called the KDF "PKDF". Both corrected; the page now also distinguishes `argon2i` (key derivation) from `argon2id` (password hashing), matching `keyutils.ts` and `password.ts`.
- `custom-themes/introduction.md` claimed 10 scopes (there are 11 — `titleBar` was undocumented), 5 variants (there are 6 — `disabled` was undocumented) and "12 colors" above a table of 11 (there are 13 — `shade` and `textSelection` were missing). The transparency column was also wrong for `background` and `placeholder`.
- `recovering-your-account.md` documented the first and third recovery options and skipped the second (`{{backupFileMethod}}`), had a truncated two-step Mobile tab, and carried an unresolved `<!--Needs Validation-->` comment. Mobile recovery is real (`apps/mobile/app/components/auth/forgot-password.tsx`) and is now documented.
- Two images were wrong: the "clear completed tasks" step pointed at `sort-task-icon.png`, and the notebook "create a note" steps used the desktop plus button in the mobile tab with "Three dot button" as alt text.
- `faqs/what-are-merge-conflicts.md` said "which version of the **name** you want to keep".

**Structure**

- The VitePress migration dropped the ten `README.md` section stubs the legacy docgen site served as directory landing pages, so `/organizing-notes`, `/rich-text-editor`, `/custom-themes`, `/faqs`, `/mobile-integration`, `/desktop-integration`, `/web-clipper` and `/inbox-api` started returning 404. Every *article* slug survived the migration unchanged; only these eight moved. They are now 301'd to their cluster hub from `contents/public/_redirects`. (`/` and `/importing-notes` were already covered by `index.md` and `importing-notes/index.md`.)
- `backup-and-restore-notes-in-notesnook.md` and `custom-themes/publish-a-theme.md` each had two `# H1`s, which hid a whole section from the page outline. Both now use one H1.
- `app-lock.md` had `###` headings **inside** both tab panels, so each appeared twice in the outline with duplicate anchor slugs, plus step numbering that ran across headings and six `alt="drawing"` images. Rewritten with headings outside the tabs and real UI string keys.
- `keyboard-shortcuts.md` started at `###`, leaving the page outline empty. The generator (`scripts/document-keyboard-shortcuts.mjs`) now emits `##` per category and a `## Related pages` block, and the page carries proper SEO frontmatter.
- `/self-hosting` was commented out of `sidebar.mjs` while remaining live, canonical and in the sitemap. It is now in the sidebar under Advanced.
- `faqs/what-are-merge-conflicts.md` had an `### Example:` with no H2 parent.
- `mobile-integration/pin-notes-to-notifications.md` rendered an empty `::: info` box.

**Accessibility and SEO**

- 82 images had useless or missing alt text: 37 reading `" in Notesnook"`, 27 reading `"Toolbar"` on theme screenshots, 9 `alt="drawing"`, 6 `"Step in Notesnook"`, 2 raw `<img>` tags with no `alt` at all, and 1 filename. All now describe what the reader should look for.
- 33 pages had no `pageTitle` or `keywords`. All now do.
- 5 pages had a body FAQ section but emitted only `TechArticle`. They now emit `FAQPage` (13 pages total, up from 5).
- 4 meta descriptions exceeded 160 characters.
- 32 uses of the banned words "simply", "just", "easily" across 30 files, and two version numbers in body copy ("Starting from v3", "Starting from v2.6.0"), both forbidden by `STYLE.md`.

**Voice and editorial**

- `faqs/is-there-an-eta.md` hotlinked an image from `imgs.xkcd.com` — a third-party request from a privacy product's help site — and told users that asking about ETAs "is annoying". Rewritten to point at the roadmap and issue tracker.
- First-person asides removed from `how-is-my-data-encrypted.md` ("that is when I found out"), `create-a-theme-with-theme-builder.md` ("like me") and `publish-a-theme.md`, which linked to a maintainer's personal fork.
- The two "login to … attachments" FAQs were 83-word near-duplicates with trailing whitespace in their titles. Both **keep their URLs** — `packages/intl/src/strings.ts:2625` and `:2741` link to them from inside the app — and are now distinct, question-shaped pages.
- `import-notes-from-standardnotes.md` warned that its own steps could not be completed, then presented them anyway. Restructured around the Markdown/plaintext route that actually works.

## Open questions that need a product answer

These could not be settled from this repo and are the main risk of a wrong claim shipping:

1. **Storage accounting.** `is-feature-available.ts` captions the limit `50MB/mo`, `1GB/mo` and so on, and `storageUsed` / `totalStorage` arrive from the server. Whether the counter is a monthly upload allowance that resets, or a measure of bytes currently stored, is not determinable client-side. The docs now consistently describe it as a **monthly allowance that does not return when you delete a file** — this needs confirming, and correcting everywhere if it is wrong.
2. **Trial length per plan and period**, which is server-driven.
3. **Monograph 15 MB limit** and whether links-and-embeds gating is enforced anywhere client-side.
4. **Inbox API** 10 MB body cap and 60 req/min rate limit — both server-side.
5. **Per-provider "supported formats" checklists**, which depend on `@notesnook-importer/core` rather than this repo.

## Screenshots

**24 TODO markers** remain, in three groups:

| Group | Why it isn't captured | Examples |
| --- | --- | --- |
| Needs a signed-in account | The capture harness runs logged out on purpose | attachment manager, sync status indicator, 2FA recovery codes, note links panel |
| Needs a paid plan | Feature is gated | the expiry badge on a note (Pro) |
| Needs a device or a date | Not reproducible in a browser | Android widgets, quick settings tile, Wrapped (December only) |

Five screenshots in `contents/public/screenshots/` were captured from a real production build of the web app and are current.

## Existing images are old

**69 of 81 images date from 2023**, 9 from 2024 and 3 from 2026. The app has been through a major redesign since — editor tabs, a restructured settings dialog, the new side menu — so most screenshots predate the UI they illustrate.

| Image | Age | Problem |
| --- | --- | --- |
| `config-toolbar-desktop.png` | 2023-06 | Dialog is titled **"Configure toolbar"**; the current label is **"Customize toolbar"** |
| `first-note-desktop.png` | 2023-02 | Toolbar predates the bi-directional note link tool |
| `desktop-enable-app-lock.png` | 2024 | Matches 3.4 except the new **Inbox** section is missing |

The 2023 cohort covering tables (11 images), publishing themes (16), colors, backups and the first-note flow should be re-shot wholesale rather than audited one by one.

## Remaining work, in priority order

1. **Answer the five open questions above**, then correct any page that guessed wrong.
2. **Screenshots** — 25 TODOs, plus the 2023-era images. The account-gated ones need a throwaway account; the Android ones need a device or emulator.
3. **Thin coverage worth deepening**: debug logs (`other-settings.ts:400`, the first thing support asks for), desktop CLI arguments (`apps/desktop/src/cli.ts:38-83`), the `nn://` protocol handler on desktop, and subscription management detail (payment method, cancel trial, mobile restore purchase).

## Notes for whoever writes here next

- `docs/help/STYLE.md` is the contract: verification requirement, plan tags, platform tabs, SEO frontmatter, linking clusters.
- Plan tiers come from `packages/common/src/utils/is-feature-available.ts` and nowhere else. All 35 gated features are monotonic across tiers, so "Pro includes Essential" is provably true.
- Where `keybindings.ts` and an editor extension disagree about a shortcut, the extension wins.
- `keyboard-shortcuts.md` is generated. Edit `scripts/document-keyboard-shortcuts.mjs`, never the page.
- A frontmatter value containing `: ` must be quoted, or the YAML parser fails the build.
- Some help URLs are linked from inside the app via `packages/intl/src/strings.ts`. Grep it before renaming or deleting a page.
- `contents/v<version>/` is generated build output. Never edit it; edit the root copy, and use `npm run fork` to preserve old text for an archived version.
