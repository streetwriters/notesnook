# Notesnook Help

The source of [notesnook.com/help](https://notesnook.com/help), built with [VitePress](https://vitepress.dev).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build; fails on dead internal links
npm run preview  # serve the built site
```

## Where things are

|                          |                                                     |
| ------------------------ | --------------------------------------------------- |
| `contents/`              | the articles — a file's path here is its public URL |
| `contents/public/`       | images and fonts, served from `/`                   |
| `.vitepress/config.mts`  | site config, nav, head                              |
| `.vitepress/sidebar.mjs` | the sidebar — **add every new article here**        |
| `.vitepress/theme/`      | Notesnook design tokens and self-hosted fonts       |

## UI labels come from the app

Button and menu labels are written as string keys and resolved at build time from `@notesnook/intl`:

```md
Click on `{{archive}}` to archive the note.
```

Rename that string in the app and this page updates on the next build. An unknown key fails the build. Run `npm run strings` to see which hardcoded labels could become keys (`-- --fix` rewrites them). Don't add strings to `packages/intl` for the docs — if there's no key, write plain text.

## Writing an article

1. Create `contents/<section>/<slug>.md` with `title` (short, used in the sidebar) and `description` (one sentence, used as the search snippet) frontmatter.
2. Add it to the right group in `.vitepress/sidebar.mjs`.
3. Run `npm run build` before opening a PR.

Steps that differ per platform go in tabs, which stay in sync across the whole site via `key:platform`:

```md
:::tabs key:platform
== Desktop/Web

1. Right click on a note to open the `Note properties` menu.

== Mobile

1. Press the three dot button on a note.

:::
```

Callouts use VitePress containers — `::: info`, `::: tip`, `::: warning`, `::: danger`, `::: details`.

Renaming or moving a file changes a live URL that the apps and support replies link to. Don't, unless a 301 goes into `contents/public/_redirects` with it. Some pages are linked from inside the app via `packages/intl/src/strings.ts`, and the importer package links to the `importing-notes/*` slugs — grep both before touching a slug.

## Versioning

The docs are versioned by Notesnook version. The **latest** version lives at the site root, so canonical URLs never move; older versions are served from `/v<version>/` and reachable from the version picker in the nav bar.

Older versions are stored as **differences, not copies**. A page is shared by every version until it actually changes; only then does the old text get its own file. `.vitepress/versions.mjs` holds `LATEST` and the list of older versions.

**When Notesnook ships a new version:**

```bash
npm run version -- <next-version>
```

Nothing is copied — the outgoing version becomes an older version whose pages are all still shared with the root.

**When you change a page in a way that doesn't apply to the old version**, preserve the old text first, then edit the root copy as usual:

```bash
npm run fork -- <old-version> organizing-notes/archive-notes
```

That writes `contents/_versions/<old-version>/organizing-notes/archive-notes.md` — the only file that version needs. For a page that didn't exist in an older version, add its path to `contents/_versions/<version>/_excluded.txt` instead.

`npm run versions` (run automatically before dev and build) composes the full `/v<version>/` trees from the shared pages plus those overrides. The composed trees live in `contents/v<version>/` and are gitignored — never edit them.

Archived pages carry a banner linking to the current version of the same page, are excluded from search and the sitemap, and are `noindex` so they don't compete with the latest docs. Images are shared across versions.

## Deployment

`.github/workflows/help.publish.yml` builds and deploys `.vitepress/dist/` to Cloudflare Pages on every push to `master` that touches `docs/help/**`.
