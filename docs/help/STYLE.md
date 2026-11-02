# Help docs — writing conventions

Every page on notesnook.com/help follows these. They cover accuracy, plan tags, SEO and linking.

## 1. Accuracy is non-negotiable

Never describe UI from memory. Every menu label, settings path, limit, default and plan gate must be traced to source in this monorepo before it is written:

- user-facing strings — `packages/intl/src/strings.ts`
- web/desktop UI — `apps/web/src/`, `apps/desktop/src/`
- mobile UI — `apps/mobile/app/`
- limits and plan gates — `packages/common/src/utils/is-feature-available.ts`
- behaviour, sync, encryption, retention — `packages/core/src/`

### Quote labels by key, not by hand

Don't type a label and hope it stays true. Write the **string key** and the build resolves it from the app's own catalogue:

```md
Click on `{{archive}}` renders: Click on `Archive`
Open `{{privacyAndSecurity}}` renders: Open `Privacy & security`
```

Keys come from `packages/intl/src/strings.ts` — the same catalogue the apps render from — so when someone renames a string in the app, every page quoting it updates on the next build. An unknown key **fails the build**; it never ships as a placeholder.

- Plural entries take a count: `{{notebooks:2}}`.
- `npm run strings` lists labels that could be keys but aren't; `-- --fix` rewrites the unambiguous ones.
- **Never add a string to `packages/intl` for the docs' sake.** If a label has no key — third-party UI, native OS text, a screen that isn't localized — write it as plain text.

If web and mobile differ, both go in the platform tabs. If you cannot verify something, leave it out and flag it — never guess.

## 2. Frontmatter

```yaml
---
title: Archive # short sidebar label, 2–3 words
pageTitle: How to archive notes… # optional: SEO <title>, ~60 chars
description: One sentence… # required, <160 chars, becomes the search snippet
keywords: # optional, real search phrases
  - archive notes notesnook
schema: howto # optional: howto | faq | article (default article)
faqs: # required when schema: faq
  - q: …
    a: …
---
```

`schema: howto` turns the page's numbered steps into HowTo structured data automatically. `schema: faq` emits FAQPage structured data from the `faqs` list — the same Q&As must also appear in the page body.

## 3. Plan tags

Any feature that needs a paid plan is tagged inline, on the heading that introduces it:

```md
## Set a note to expire <PlanTag plan="pro" />
```

`plan` is the **lowest** plan that unlocks it: `essential`, `pro` or `believer`. Plans are cumulative — a `pro` tag means Pro and Believer. For platform-limited features add a note:

```md
## Pin a note to your notifications <PlanTag plan="pro" note="Android only" />
```

Verify the tier in `is-feature-available.ts` before tagging. Also state the consequence in prose where it matters ("free plans keep 100 versions per note"), and link to [Plans & limits](/plans-and-limits).

## 4. Article shape

```md
# Full human title

One or two sentences: what this is and why someone would want it.

## Task in imperative form

:::tabs key:platform
== Desktop/Web

1. …

== Mobile

1. …

:::
```

- One `# H1`, first line of the body.
- `##` per task, phrased as an action: "Archive a note", not "Archiving".
- Numbered steps, one action each, ideally ≤ 6.
- Close with the confirmation state — what the user should now see.
- `key:platform` is mandatory on platform tabs so the choice syncs sitewide. Labels: `Desktop/Web`, `Desktop`, `Web`, `Mobile`, `Android`, `iOS`, `Windows`, `macOS`, `Linux`.
- If a feature is missing on a platform, say so in that tab rather than omitting it.

## 5. Callouts

`::: info` context · `::: tip` shortcut · `::: warning` data loss or something irreversible · `::: danger` unrecoverable · `::: details` folded tangent.

Anything touching the vault, encryption, recovery or deletion must state plainly that **Notesnook cannot recover data or passwords for you**.

## 6. SEO

The help site already ranks #1 for high-intent queries like `import enex`, so each page is a landing page:

- **Write the H1 as the question a person types.** "How do I import notes from Evernote?" beats "Evernote importing".
- **Use real phrasings in `##` headings** — "Can I use it offline?", "Why is my note not syncing?" — they win featured snippets.
- **Answer in the first 40 words** after the H1. That paragraph is what Google quotes.
- **Never leave alt text empty.** Describe what the reader should look for: `![The Archive item in the note context menu](/img.png)`.
- **Every page ends with a `## Related pages` list** of 3–6 links with descriptive anchors (the home page, `/docs` and `/404` are exempt — they are already link lists) — "[backing up your notes](/backup-and-restore-notes-in-notesnook)", never "click here". This is what builds the internal link graph.
- **Link the first mention** of any concept that has its own page, in body text, with the concept as the anchor.
- **Add `<GetNotesnook />`** to pages people arrive at from search with buying intent — importers, comparisons, "how do I move from X" — placed after the instructions, never before them.
- Prefer one page that fully answers a question over three thin pages.

## 7. Internal linking clusters

Pages are grouped into clusters, each with a hub that links to every member and members that link back to the hub and sideways to siblings:

| Cluster            | Hub                                                           |
| ------------------ | ------------------------------------------------------------- |
| Importing          | [Importing notes](/importing-notes/)                          |
| Editor             | [Editor toolbar](/rich-text-editor/rich-text-editor-toolbar)  |
| Organization       | [Notebooks](/organizing-notes/organize-notes-using-notebooks) |
| Privacy & security | [How is my data encrypted?](/how-is-my-data-encrypted)        |
| Sync               | [How sync works](/sync/how-sync-works)                        |
| Plans              | [Plans & limits](/plans-and-limits)                           |

Any page that mentions a paid feature links to the plans hub. Any page that mentions encryption links to the encryption hub.

## 8. Things that are not allowed

- Undocumented guesses about UI, limits or plan gates.
- Version numbers in body copy ("as of v3.2").
- "Simply", "just", "easily", "seamlessly", "powerful".
- Telling the reader to contact support before the documented steps.
- Image paths that don't exist — leave `<!-- TODO: screenshot — … -->` instead.
- Renaming or moving an existing page (its URL is live and linked from the apps). Some pages are linked from inside the app itself via `packages/intl/src/strings.ts` — grep it before touching a slug.
- More than one `# H1` on a page, and `##`/`###` headings inside a `:::tabs` block. Headings in tabs are emitted once per tab, so they show up twice in the page outline with duplicate anchors.
- Unquoted frontmatter values containing `: ` — the YAML parser fails the build. Quote them.
- Alt text that describes nothing: `drawing`, a filename, or an unfilled template. Inline UI glyphs ("press the ⋯ button") are the one case where a short label is correct.
