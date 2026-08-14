import { defineConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import taskLists from "markdown-it-task-lists";
import { sidebar } from "./sidebar.mjs";
import {
  LATEST,
  isArchivedPath,
  versionOfPath,
  versionsNavItem
} from "./versions.mjs";
// Latest docs live at the root; the /v<version>/ trees and their sidebars are
// composed from contents/_versions/ by scripts/build-versions.mjs, which runs
// before dev and build.
import { archivedSidebars } from "./sidebars/generated.mjs";
import { seoHead, seoTitle } from "./seo.mjs";
import { stringsMarkdownPlugin } from "./strings.mjs";

export default defineConfig({
  title: "Notesnook Help",
  description:
    "Your complete and free resource to using Notesnook as a daily note taking app to organize your work and life while safeguarding your privacy.",
  lang: "en-US",
  srcDir: "./contents",
  base: "/help/",
  outDir: "./.vitepress/dist/help",
  // Version overrides are source material for build-versions.mjs, not pages.
  // The Standard Notes importer is unpublished for now — the page is kept in
  // the repo but is not built, linked or listed in the sitemap. Delete the
  // second entry (and restore the sidebar link) to publish it again.
  srcExclude: [
    "_versions/**",
    "importing-notes/import-notes-from-standardnotes.md",
    "self-hosting.md"
  ],
  cleanUrls: true,
  lastUpdated: true,
  metaChunk: true,
  sitemap: {
    hostname: "https://notesnook.com/help",
    // Only the latest docs belong in the sitemap.
    transformItems: (items) =>
      items.filter(
        (i) => !isArchivedPath(`/${i.url}`) && !i.url.startsWith("404")
      )
  },

  transformPageData(pageData, ctx) {
    const path = `/${pageData.relativePath}`;
    pageData.frontmatter.head ??= [];

    // Archived pages are kept out of search engines so they don't compete with
    // the latest docs, and are tagged so the layout can show a version banner.
    if (isArchivedPath(path)) {
      pageData.frontmatter.archivedVersion = versionOfPath(path);
      pageData.frontmatter.latestVersion = LATEST;
      pageData.frontmatter.head.push([
        "meta",
        { name: "robots", content: "noindex,follow" }
      ]);
      return;
    }

    // Canonical, Open Graph, Twitter cards and JSON-LD for the live docs.
    seoTitle(pageData);
    pageData.frontmatter.head.push(...seoHead(pageData, ctx));
  },

  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    // The two weights that render above the fold on every page.
    [
      "link",
      {
        rel: "preload",
        href: "/help/fonts/Inter-Regular.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: ""
      }
    ],
    [
      "link",
      {
        rel: "preload",
        href: "/help/fonts/Inter-SemiBold.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: ""
      }
    ],
    ["meta", { name: "theme-color", content: "#008837" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Notesnook Help" }],
    ["meta", { property: "og:image", content: "/logo.png" }],
    [
      "script",
      {
        async: "",
        defer: "",
        "data-website-id": "676a7449-2151-44f7-a8c7-3b0691cade30",
        src: "https://aas.streetwriters.co/script.js",
        "data-domains": "notesnook.com"
      }
    ]
  ],

  markdown: {
    config(md) {
      md.use(tabsMarkdownPlugin);
      // `- [x] item` renders as a real checkbox instead of literal "[x]".
      md.use(taskLists, { label: true, labelAfter: true });

      // `{{archive}}` becomes the live label from packages/intl.
      md.use(stringsMarkdownPlugin);

      // An image that shares a line with text is a UI glyph ("press the ⋯
      // button"), not a figure. Tag those so CSS can keep them in the line —
      // :only-child can't be used for this because it ignores text nodes.
      md.core.ruler.push("nn_inline_glyphs", (state) => {
        for (const token of state.tokens) {
          if (token.type !== "inline" || !token.children) continue;
          // Line breaks split the inline token into segments. A screenshot on
          // its own line inside a numbered step lives in the same inline token
          // as the step's text, so "does this token contain text?" would wrongly
          // shrink it — the question is whether text sits on *its* line.
          let segment: typeof token.children = [];
          const segments = [segment];
          for (const child of token.children) {
            if (child.type === "softbreak" || child.type === "hardbreak") {
              segment = [];
              segments.push(segment);
            } else segment.push(child);
          }
          for (const line of segments) {
            const sharesLineWithText = line.some(
              (child) =>
                (child.type === "text" && child.content.trim()) ||
                child.type === "code_inline"
            );
            if (!sharesLineWithText) continue;
            for (const child of line) {
              if (child.type === "image")
                child.attrJoin("class", "inline-glyph");
            }
          }
        }
        return true;
      });
    },
    image: { lazyLoading: true }
  },

  themeConfig: {
    logo: "/logo.png",
    siteTitle: "Help",

    nav: [
      versionsNavItem,
      { text: "Downloads", link: "https://notesnook.com/downloads" },
      { text: "Pricing", link: "https://notesnook.com/pricing" },
      {
        text: "More",
        items: [
          { text: "Notesnook", link: "https://notesnook.com" },
          { text: "Blog", link: "https://blog.notesnook.com" },
          { text: "Roadmap", link: "https://notesnook.com/roadmap" },
          { text: "Contact us", link: "https://notesnook.com/contact-us" },
          {
            text: "Report an issue",
            link: "https://github.com/streetwriters/notesnook/issues/new/choose"
          }
        ]
      }
    ],

    sidebar: { ...archivedSidebars, "/": sidebar },

    search: {
      provider: "local",
      options: {
        detailedView: true,
        // Archived versions are excluded so a search for "archive a note" does
        // not return the same article once per version.
        _render(src, env, md) {
          if (isArchivedPath(`/${env.relativePath}`)) return "";
          return md.render(src, env);
        }
      }
    },

    outline: { level: [2, 3], label: "On this page" },

    editLink: {
      pattern:
        "https://github.com/streetwriters/notesnook/edit/master/docs/help/contents/:path",
      text: "Suggest an edit to this page"
    },

    lastUpdated: {
      text: "Last updated",
      formatOptions: { dateStyle: "medium", forceLocale: false }
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/streetwriters/notesnook" },
      { icon: "mastodon", link: "https://mastodon.social/@notesnook" },
      { icon: "discord", link: "https://discord.com/invite/zQBK97EE22" },
      { icon: "x", link: "https://x.com/notesnook" }
    ],

    footer: {
      message:
        'Made with care by <a href="https://streetwriters.co">Streetwriters</a>. Notesnook is <a href="https://github.com/streetwriters/notesnook">open source</a>.',
      copyright: "Copyright © 2026 Streetwriters (Private) Limited"
    },

    docFooter: { prev: "Previous", next: "Next" },
    externalLinkIcon: true,
    returnToTopLabel: "Back to top",
    darkModeSwitchLabel: "Appearance"
  }
});
