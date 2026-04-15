/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { decodeHTML5, escape } from "entities";
import { Parser } from "htmlparser2";
import { getDomPurify } from "./dom-purify.js";

export const parseHTML = (input: string) =>
  "DOMParser" in globalThis
    ? new globalThis.DOMParser().parseFromString(
        wrapIntoHTMLDocument(input),
        "text/html"
      )
    : null;

export const sanitizeHtml = (html: string): string => {
  const inputHtml = normalizeToHtmlBody(html);
  return getDomPurify().sanitize(inputHtml, {
    RETURN_DOM: false,
    ADD_TAGS: ["iframe"]
  }) as string;
};

export function getDummyDocument() {
  const doc = parseHTML("<div></div>");
  return doc;
}

export function getInnerText(element: HTMLElement) {
  return decodeHTML5(element.textContent || element.innerText);
}

function wrapIntoHTMLDocument(input: string) {
  if (typeof input !== "string") return input;
  if (input.includes("<body>")) return input;

  return `<!doctype html><html lang="en"><head><title>Document Fragment</title></head><body>${input}</body></html>`;
}

const SELF_CLOSING_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

function isHtmlValid(html: string): boolean {
  const trimmed = html.trim();
  if (!trimmed) return true;

  // Strip comments and script/style content before tag counting to avoid
  // false matches on tags appearing inside comments or raw text blocks.
  const stripped = trimmed
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  // Extract all opening and closing tag names
  const openTagMatches = stripped.matchAll(/<([a-z][a-z0-9]*)\b/gi);
  const closeTagMatches = stripped.matchAll(/<\/([a-z][a-z0-9]*)\b/gi);

  const openTags = Array.from(openTagMatches, (m) => m[1].toLowerCase());
  const closeTags = Array.from(closeTagMatches, (m) => m[1].toLowerCase());

  // Document-level tags (body, html, head) are allowed to be unclosed in fragments
  const documentTags = new Set(["body", "html", "head"]);

  // Count content tags (non-document, non-void tags) — void/self-closing elements
  // never have a closing tag so they must not affect the balance check.
  const openContentTags = openTags.filter(
    (tag) => !documentTags.has(tag) && !SELF_CLOSING_TAGS.has(tag)
  );
  const closeContentTags = closeTags.filter(
    (tag) => !documentTags.has(tag) && !SELF_CLOSING_TAGS.has(tag)
  );

  // For content tags: opening and closing must match
  if (openContentTags.length !== closeContentTags.length) {
    return false;
  }

  // Now do strict tag matching for actual mismatches
  const openStack: string[] = [];
  let hasError = false;

  const parser = new Parser(
    {
      onopentag: (name) => {
        if (!SELF_CLOSING_TAGS.has(name.toLowerCase())) {
          openStack.push(name.toLowerCase());
        }
      },
      onclosetag: (name) => {
        const nameLower = name.toLowerCase();
        // htmlparser2 fires onclosetag for void/self-closing elements immediately
        // after onopentag. We never push them onto the stack, so skip here too.
        if (SELF_CLOSING_TAGS.has(nameLower)) return;

        const lastOpen = openStack[openStack.length - 1];

        if (!lastOpen) {
          hasError = true;
          return;
        }

        if (lastOpen === nameLower) {
          openStack.pop();
        } else {
          // Any tag mismatch is an error (except for auto-fixed document tags)
          hasError = true;
        }
      }
    },
    {
      lowerCaseTags: true
    }
  );

  try {
    parser.end(html);
    // Unclosed content tags = invalid
    if (openStack.length > 0) {
      return false;
    }
    return !hasError;
  } catch {
    return false;
  }
}

function wrapInCodeBlock(html: string): string {
  const escaped = escape(html);
  return `<html><body><pre><code>${escaped}</code></pre></body></html>`;
}

export function normalizeToHtmlBody(input: string) {
  const source = typeof input === "string" ? input.trim() : "";
  if (!source) return "<html><body></body></html>";

  // If HTML has broken/incomplete tags, wrap in code block for display
  if (!isHtmlValid(source)) {
    return wrapInCodeBlock(source);
  }

  const hasHtmlTag = /<html\b[^>]*>/i.test(source);
  const hasBodyOpenTag = /<body\b[^>]*>/i.test(source);
  const hasBodyCloseTag = /<\/body>/i.test(source);

  // If a full body block exists, normalize to <html><body...>...</body></html>.
  const bodyBlock = source.match(/<body\b[^>]*>[\s\S]*?<\/body>/i)?.[0];
  if (bodyBlock) {
    return `<html>${bodyBlock}</html>`;
  }

  // HTML exists but no complete body: strip outer html and wrap remaining content in body.
  if (hasHtmlTag) {
    const inner = source
      .replace(/<!doctype[^>]*>/i, "")
      .replace(/<html\b[^>]*>/i, "")
      .replace(/<\/html>/i, "")
      .trim();

    const headBlock = inner.match(/<head\b[^>]*>[\s\S]*?<\/head>/i)?.[0];

    // Handle case with <body ...> present but missing </body>.
    if (hasBodyOpenTag && !hasBodyCloseTag) {
      const bodyOpen = inner.match(/<body\b[^>]*>/i)?.[0] || "<body>";
      const bodyContent = inner.replace(/<body\b[^>]*>/i, "");
      return `<html>${bodyOpen}${bodyContent}</body></html>`;
    }

    if (headBlock) {
      const bodyContent = inner.replace(headBlock, "").trim();
      return `<html>${headBlock}<body>${bodyContent}</body></html>`;
    }

    return `<html><body>${inner}</body></html>`;
  }

  // Body exists without html: add html wrapper, and close body if needed.
  if (hasBodyOpenTag) {
    if (!hasBodyCloseTag) return `<html>${source}</body></html>`;
    return `<html>${source}</html>`;
  }

  // Plain fragment/text.
  return `<html><body>${source}</body></html>`;
}

export function extractHeadline(html: string) {
  let text = "";
  let start = false;
  const parser = new Parser(
    {
      onopentag: (name) => {
        if (name === "p") start = true;
      },
      onclosetag: (name) => {
        if (name === "p") {
          start = false;
          parser.pause();
          parser.end();
        }
      },
      ontext: (data) => {
        if (start) text += data;
      }
    },
    {
      lowerCaseTags: false,
      decodeEntities: true
    }
  );
  parser.end(html);
  return text;
}

export function extractTitle(html: string, characterLimit: number) {
  let text = "";
  const parser = new Parser(
    {
      ontext: (data) => {
        text += data;
        if (text.length > characterLimit) {
          text = text.slice(0, characterLimit);
          parser.pause();
          parser.end();
        }
      }
    },
    {
      lowerCaseTags: false,
      decodeEntities: true
    }
  );
  parser.end(html);
  return text;
}

type OnTagHandler = (
  name: string,
  attr: Record<string, string>,
  pos: { start: number; end: number }
) => void;

export class HTMLParser {
  private parser: Parser;
  constructor(options: { ontag?: OnTagHandler } = {}) {
    const { ontag } = options;

    this.parser = new Parser(
      {
        onopentag: (name, attr) =>
          ontag &&
          ontag(name, attr, {
            start: this.parser.startIndex,
            end: this.parser.endIndex
          })
      },
      {
        recognizeSelfClosing: true,
        xmlMode: false,
        decodeEntities: false,
        lowerCaseAttributeNames: false,
        lowerCaseTags: false,
        recognizeCDATA: false
      }
    );
  }

  parse(html: string) {
    this.parser.end(html);
    this.parser.reset();
  }
}

const INLINE_TAGS = [
  "a",
  "abbr",
  "acronym",
  "b",
  "bdo",
  "big",
  "br",
  "button",
  "cite",
  "code",
  "dfn",
  "em",
  "i",
  "img",
  "input",
  "kbd",
  "label",
  "map",
  "object",
  "output",
  "q",
  "samp",
  "script",
  "select",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "textarea",
  "time",
  "tt",
  "var"
];

export function extractMatchingBlocks(html: string, matchTagName: string) {
  const matches: string[] = [];
  let text = "";
  let openedTag: string | undefined = undefined;
  let hasMatches = false;

  const parser = new Parser(
    {
      ontext: (data) => (text += data),
      onopentag(name, attributes) {
        if (!INLINE_TAGS.includes(name) && name !== matchTagName) {
          openedTag = name;
          text = "";
          hasMatches = false;
        }
        if (name === matchTagName) {
          hasMatches = true;
          let tagString = `<${name}`;
          if (attributes.id) {
            tagString += ` id="${attributes.id}"`;
          }
          tagString += ">";
          text += tagString;
        }
      },
      onclosetag(name) {
        if (name === "br") text += "\n";
        if (name === openedTag) {
          if (hasMatches) matches.push(text);
          text = "";
          hasMatches = false;
          openedTag = undefined;
        }
        if (name === matchTagName) text += `</${name}>`;
      }
    },
    {
      lowerCaseTags: false,
      decodeEntities: false
    }
  );
  parser.end(html);
  if (hasMatches && text) matches.push(text);

  return matches;
}
