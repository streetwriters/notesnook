/**
 * Per-page SEO: canonical URL, Open Graph, Twitter cards and JSON-LD.
 *
 * The help site ranks #1 for high-intent queries like "import enex", so every
 * page needs to be individually addressable, individually described, and
 * eligible for rich results. Driven from each page's frontmatter:
 *
 *   ---
 *   title: Import from Evernote          # sidebar label
 *   description: One sentence…           # meta description + search snippet
 *   pageTitle: How to import Evernote…   # optional: overrides the <title> only
 *   keywords: [import enex, evernote…]   # optional
 *   schema: howto | faq | article        # optional, default article
 *   faqs:                                # required when schema: faq
 *     - q: …
 *       a: …
 *   ---
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { HeadConfig, TransformPageContext, PageData } from "vitepress";
import { resolveString } from "./strings.mjs";

const SITE = "https://notesnook.com/help";
const OG_IMAGE = `${SITE}/logo.png`;

const url = (relativePath: string) =>
  `${SITE}/${relativePath
    .replace(/(index)?\.md$/, "")
    .replace(/\/$/, "")}`.replace(/\/$/, "") || SITE;

/** "organizing-notes/archive-notes.md" -> ["Organizing notes", "Archive notes"] */
function breadcrumbs(relativePath: string, title: string) {
  const parts = relativePath.split("/").slice(0, -1);
  const crumbs = [{ name: "Notesnook Help", item: SITE }];
  let path = "";
  for (const part of parts) {
    path += `/${part}`;
    crumbs.push({
      name: part.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
      item: `${SITE}${path}`
    });
  }
  crumbs.push({ name: title, item: url(relativePath) });
  return crumbs;
}

/**
 * The page's markdown. `transformPageData`'s context does not carry the source,
 * so it is read back off disk.
 */
function pageSource(relativePath: string) {
  try {
    return readFileSync(join(process.cwd(), "contents", relativePath), "utf8");
  } catch {
    return "";
  }
}

/** Numbered list items in the first tab of a page become HowTo steps. */
const STRING_TOKEN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)(?::(\d+))?\s*\}\}/g;

function howToSteps(src: string) {
  const steps: { name: string; text: string }[] = [];
  for (const line of src.split("\n")) {
    const m = line.match(/^\s*\d+\.\s+(.*\S)\s*$/);
    if (!m) continue;
    const text = m[1]
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // These steps come from the raw markdown, before the markdown-it plugin
      // has swapped `{{key}}` for the app's label — resolve them here too, or
      // the structured data Google reads ships the raw tokens.
      .replace(STRING_TOKEN, (_m, key: string, count?: string) =>
        resolveString(key, count ? Number(count) : undefined)
      )
      .replace(/[`*_]/g, "")
      .trim();
    if (text.length > 3) steps.push({ name: text.slice(0, 110), text });
    if (steps.length >= 12) break;
  }
  return steps;
}

function jsonLd(pageData: PageData, ctx: TransformPageContext) {
  const fm = pageData.frontmatter;
  const title = (fm.pageTitle || fm.title || pageData.title) as string;
  const description = (fm.description || "") as string;
  const pageUrl = url(pageData.relativePath);
  const graph: Record<string, unknown>[] = [];

  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs(pageData.relativePath, title).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.item
    }))
  });

  const publisher = {
    "@type": "Organization",
    name: "Notesnook",
    url: "https://notesnook.com",
    logo: OG_IMAGE
  };

  if (fm.schema === "faq" && Array.isArray(fm.faqs) && fm.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: fm.faqs.map((f: { q: string; a: string }) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  } else if (fm.schema === "howto") {
    const steps = howToSteps(pageSource(pageData.relativePath));
    if (steps.length)
      graph.push({
        "@type": "HowTo",
        name: title,
        description,
        url: pageUrl,
        step: steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
          url: `${pageUrl}#${i + 1}`
        })),
        tool: [{ "@type": "HowToTool", name: "Notesnook" }],
        totalTime: fm.totalTime || undefined
      });
  }

  graph.push({
    "@type": "TechArticle",
    headline: title,
    description,
    url: pageUrl,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      name: "Notesnook Help",
      url: SITE
    },
    about: {
      "@type": "SoftwareApplication",
      name: "Notesnook",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "Windows, macOS, Linux, Android, iOS, Web"
    },
    author: publisher,
    publisher,
    dateModified: pageData.lastUpdated
      ? new Date(pageData.lastUpdated).toISOString()
      : undefined
  });

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

/**
 * Head tags for one page. Returned as frontmatter `head` entries so VitePress
 * merges them into the rendered <head>.
 */
export function seoHead(
  pageData: PageData,
  ctx: TransformPageContext
): HeadConfig[] {
  const fm = pageData.frontmatter;
  if (fm.layout === "home" && !fm.description) return [];

  const title = (fm.pageTitle || fm.title || pageData.title) as string;
  const description = (fm.description || "") as string;
  const pageUrl = url(pageData.relativePath);
  const fullTitle = fm.pageTitle
    ? `${fm.pageTitle} | Notesnook Help`
    : `${title} | Notesnook Help`;

  const head: HeadConfig[] = [
    ["link", { rel: "canonical", href: pageUrl }],
    ["meta", { property: "og:title", content: fullTitle }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { property: "og:url", content: pageUrl }],
    ["meta", { property: "og:image", content: OG_IMAGE }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: fullTitle }],
    ["meta", { name: "twitter:description", content: description }]
  ];

  if (Array.isArray(fm.keywords) && fm.keywords.length)
    head.push(["meta", { name: "keywords", content: fm.keywords.join(", ") }]);

  head.push(["script", { type: "application/ld+json" }, jsonLd(pageData, ctx)]);

  return head;
}

/** The <title> tag: prefer an SEO-shaped `pageTitle` when the page defines one. */
export function seoTitle(pageData: PageData) {
  if (pageData.frontmatter.pageTitle)
    pageData.title = pageData.frontmatter.pageTitle as string;
}
