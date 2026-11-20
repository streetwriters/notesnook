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
import { formatBytes } from "@notesnook/common";
import { DomUtils, parseDocument } from "htmlparser2";
import type { ChildNode, Element } from "domhandler";

export type Span = {
  text: string;
  bold?: 1;
  italic?: 1;
  strike?: 1;
  code?: 1;
  underline?: 1;
  url?: string;
  background?: string;
  color?: string;
};

export type NoteBlock =
  | { type: "heading"; level: number; spans: Span[] }
  | { type: "paragraph"; spans: Span[] }
  | {
      type: "listItem";
      spans: Span[];
      depth: number;
      number?: number;
    }
  | { type: "todo"; spans: Span[]; depth: number; checked: boolean }
  | { type: "quote"; spans: Span[] }
  | { type: "callout"; spans: Span[]; accent: string; title: boolean }
  | { type: "tableRow"; cells: Span[][]; header: boolean }
  | { type: "code"; text: string }
  | { type: "rule" };

export type NoteBlocks = { blocks: NoteBlock[] };

const WIDGET_CONTENT_LIMIT = 2000;
const MAX_HTML_LENGTH = 24000;

const SKIPPED = new Set(["script", "style", "svg", "head"]);
const BLOCKS = new Set([
  "p",
  "div",
  "section",
  "article",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  ...["h1", "h2", "h3", "h4", "h5", "h6"]
]);
const MARK_TAGS: Record<string, keyof Style> = {
  strong: "bold",
  b: "bold",
  em: "italic",
  i: "italic",
  s: "strike",
  strike: "strike",
  del: "strike",
  u: "underline",
  code: "code"
};
const PLACEHOLDERS: Record<string, string> = {
  img: "🖼️",
  audio: "🎵",
  iframe: "🌐"
};

type Style = Omit<Span, "text">;
type Item = {
  todo: boolean;
  depth: number;
  number?: number;
  checked: boolean;
  claimed: boolean;
};
type Context = { depth: number; quote: boolean; accent?: string; item?: Item };

const { isTag, isText, textContent } = DomUtils;
const attr = (node: Element, name: string) => node.attribs[name] || "";

const DEFAULT_HIGHLIGHT = "#FFF176";
const BACKGROUND_STYLE = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/i;

const CALLOUT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries({
    "#00BFBC": "abstract tldr summary tip hint important",
    "#086DDD": "info todo",
    "#08B94E": "success check done",
    "#EC7500": "help faq question warn warning caution attention",
    "#E93147": "failure fail missing danger error bug",
    "#7852EE": "example",
    "#9E9E9E": "quote cite"
  }).flatMap(([color, names]) => names.split(" ").map((name) => [name, color]))
);
const DEFAULT_CALLOUT = "#086DDD";

const hex = (value: number) =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");

function parseColor(value?: string): string | undefined {
  const color = value?.trim().toLowerCase();
  if (!color) return;

  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])[0-9a-f]?$/.exec(color);
  if (short)
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();

  const long = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(color);
  if (long) return `#${long[1]}`.toUpperCase();

  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(color);
  if (rgb) {
    return `#${hex(+rgb[1])}${hex(+rgb[2])}${hex(+rgb[3])}`.toUpperCase();
  }
}

function readableColor(background: string) {
  const [r, g, b] = [1, 3, 5].map((i) =>
    parseInt(background.slice(i, i + 2), 16)
  );
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6 * 255 ? "#000000" : "#FFFFFF";
}

function getBackground(name: string, style?: string) {
  const declared = BACKGROUND_STYLE.exec(style || "")?.[1];
  if (declared !== undefined) {
    return /^\s*(transparent|none|inherit|initial)\s*$/i.test(declared)
      ? undefined
      : parseColor(declared);
  }
  return name === "mark" ? DEFAULT_HIGHLIGHT : undefined;
}

function trimSpans(spans: Span[]) {
  const out = spans.map((span) => ({ ...span }));
  if (out.length) out[0].text = out[0].text.replace(/^\s+/, "");
  if (out.length)
    out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, "");
  return out.filter((span) => span.text.length > 0);
}

function cutSpans(spans: Span[], room: number) {
  const out: Span[] = [];
  let left = Math.max(room, 0);
  for (const span of spans) {
    if (left <= 0) break;
    out.push(
      span.text.length <= left
        ? span
        : { ...span, text: span.text.slice(0, left) }
    );
    left -= span.text.length;
  }
  if (out.length) out[out.length - 1].text += "…";
  else out.push({ text: "…" });
  return out;
}

const sameStyle = (a: Span, b: Span) =>
  a.bold === b.bold &&
  a.italic === b.italic &&
  a.strike === b.strike &&
  a.code === b.code &&
  a.underline === b.underline &&
  a.url === b.url &&
  a.background === b.background;

function inline(nodes: ChildNode[], base: Style = {}) {
  const spans: Span[] = [];
  const tail = () => (spans.length ? spans[spans.length - 1].text : "");

  const add = (text: string, style: Style) => {
    if (!text) return;
    const span: Span = { text };
    if (style.bold) span.bold = 1;
    if (style.italic) span.italic = 1;
    if (style.strike) span.strike = 1;
    if (style.code) span.code = 1;
    if (style.underline) span.underline = 1;
    if (style.url) span.url = style.url;
    if (style.background) {
      span.background = style.background;
      span.color = readableColor(style.background);
    }
    const last = spans[spans.length - 1];
    if (last && sameStyle(last, span)) last.text += text;
    else spans.push(span);
  };

  const separate = (style: Style) => {
    if (tail() && !/\s$/.test(tail())) add(" ", style);
  };

  const placeholder = (value: string, style: Style) =>
    add(!tail() || /\s$/.test(tail()) ? value : ` ${value}`, style);

  const visit = (children: ChildNode[], style: Style) => {
    for (const node of children) {
      if (isText(node)) {
        const text = node.data.replace(/\s+/g, " ");
        add(/[ \n]$|^$/.test(tail()) ? text.replace(/^ /, "") : text, style);
        continue;
      }
      if (!isTag(node) || SKIPPED.has(node.name)) continue;

      const { name } = node;
      if (name === "br") add("\n", style);
      else if (PLACEHOLDERS[name]) placeholder(PLACEHOLDERS[name], style);
      else if (MARK_TAGS[name]) {
        visit(node.children, { ...style, [MARK_TAGS[name]]: 1 });
      } else if (name === "a") {
        const href = attr(node, "href");
        visit(node.children, {
          ...style,
          url: /^https?:/i.test(href) ? href : undefined
        });
      } else if (name === "span" || name === "mark") {
        if (attr(node, "data-hash") && attr(node, "data-filename")) {
          const size = formatBytes(parseInt(attr(node, "data-size")));
          placeholder(
            `📎 ${attr(node, "data-filename")}${size ? ` (${size})` : ""}`,
            style
          );
        }
        visit(node.children, {
          ...style,
          code:
            style.code || /\bmath-inline\b/.test(attr(node, "class"))
              ? 1
              : undefined,
          background:
            getBackground(name, attr(node, "style")) ?? style.background
        });
      } else if (BLOCKS.has(name)) {
        separate(style);
        visit(node.children, style);
        separate(style);
      } else {
        visit(node.children, style);
      }
    }
  };

  visit(nodes, base);
  return trimSpans(spans);
}

function textBlock(ctx: Context, spans: Span[]): NoteBlock {
  const { item } = ctx;
  if (item && !item.claimed) {
    item.claimed = true;
    return item.todo
      ? { type: "todo", spans, depth: item.depth, checked: item.checked }
      : { type: "listItem", spans, depth: item.depth, number: item.number };
  }
  if (ctx.accent) {
    return { type: "callout", spans, accent: ctx.accent, title: false };
  }
  return { type: ctx.quote ? "quote" : "paragraph", spans };
}

function codeBlock(node: Element, out: NoteBlock[]) {
  const text = textContent(node).replace(/\s+$/, "");
  if (text) out.push({ type: "code", text });
}

function list(node: Element, ctx: Context, out: NoteBlock[]) {
  const todo =
    attr(node, "class").includes("checklist") ||
    attr(node, "data-type") === "taskList";
  let count = 0;
  for (const child of node.children) {
    if (!isTag(child) || child.name !== "li") continue;
    count++;
    const item: Item = {
      todo,
      depth: ctx.depth,
      number: node.name === "ol" ? count : undefined,
      checked:
        /\bchecked\b/.test(attr(child, "class")) ||
        attr(child, "data-checked") === "true",
      claimed: false
    };
    walk(child.children, { ...ctx, depth: ctx.depth + 1, item }, out);
  }
}

function table(node: Element, out: NoteBlock[]) {
  for (const row of DomUtils.findAll((el) => el.name === "tr", node.children)) {
    const cells = row.children.filter(
      (cell): cell is Element =>
        isTag(cell) && (cell.name === "td" || cell.name === "th")
    );
    const spans = cells.map((cell) => inline(cell.children));
    if (!spans.some((cell) => cell.length)) continue;
    out.push({
      type: "tableRow",
      cells: spans,
      header: cells.some((cell) => cell.name === "th")
    });
  }
}

function block(node: Element, ctx: Context, out: NoteBlock[]) {
  const { name } = node;
  const heading = /^h([1-6])$/.exec(name);

  if (heading && ctx.accent) {
    const spans = inline(node.children, { bold: 1 });
    if (spans.length) {
      out.push({ type: "callout", spans, accent: ctx.accent, title: true });
    }
  } else if (heading) {
    const spans = inline(node.children);
    if (spans.length) {
      out.push({
        type: "heading",
        level: Math.min(parseInt(heading[1], 10), 3),
        spans
      });
    }
  } else if (name === "ul" || name === "ol") list(node, ctx, out);
  else if (name === "blockquote")
    walk(node.children, { ...ctx, quote: true }, out);
  else if (name === "pre") codeBlock(node, out);
  else if (name === "hr") out.push({ type: "rule" });
  else if (name === "table") table(node, out);
  else if (name === "div" && /\bmath-block\b/.test(attr(node, "class"))) {
    codeBlock(node, out);
  } else if (name === "div" && /\bcallout\b/.test(attr(node, "class"))) {
    const type = attr(node, "data-callout-type").toLowerCase();
    const accent = CALLOUT_COLORS[type] || DEFAULT_CALLOUT;
    walk(node.children, { ...ctx, accent, item: undefined }, out);
  } else if (name === "p") {
    const spans = inline(node.children);
    if (spans.length) out.push(textBlock(ctx, spans));
  } else walk(node.children, ctx, out);
}

function walk(nodes: ChildNode[], ctx: Context, out: NoteBlock[]) {
  let loose: ChildNode[] = [];
  const flush = () => {
    const spans = inline(loose);
    if (spans.length) out.push(textBlock(ctx, spans));
    loose = [];
  };

  for (const node of nodes) {
    if (isTag(node) && SKIPPED.has(node.name)) continue;
    if (isTag(node) && BLOCKS.has(node.name)) {
      flush();
      block(node, ctx, out);
    } else loose.push(node);
  }
  flush();
}

const textLength = (spans: Span[]) =>
  spans.reduce((sum, span) => sum + span.text.length, 0);

const blockLength = (block: NoteBlock) => {
  if (block.type === "code") return block.text.length;
  const spans =
    "cells" in block ? block.cells.flat() : "spans" in block ? block.spans : [];
  return textLength(spans);
};

function cutBlock(block: NoteBlock, room: number): NoteBlock {
  if (block.type === "code") {
    return { ...block, text: cutSpans([{ text: block.text }], room)[0].text };
  }
  if (block.type === "tableRow") {
    const cells: Span[][] = [];
    let left = room;
    for (const cell of block.cells) {
      const length = textLength(cell);
      cells.push(length <= left ? cell : cutSpans(cell, left));
      if (length > left) break;
      left -= length;
    }
    return { ...block, cells };
  }
  return "spans" in block
    ? { ...block, spans: cutSpans(block.spans, room) }
    : block;
}

function limitBlocks(blocks: NoteBlock[], limit: number): NoteBlocks {
  const out: NoteBlock[] = [];
  let left = limit;
  for (const block of blocks) {
    const length = blockLength(block);
    if (length > left) {
      out.push(cutBlock(block, left));
      return { blocks: out };
    }
    out.push(block);
    left -= length;
  }
  return { blocks: out };
}

export function htmlToWidgetBlocks(
  html: string,
  limit = WIDGET_CONTENT_LIMIT
): NoteBlocks {
  const { children } = parseDocument(html.slice(0, MAX_HTML_LENGTH));
  const blocks: NoteBlock[] = [];
  walk(children, { depth: 0, quote: false }, blocks);
  return limitBlocks(blocks, limit);
}
