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

export interface TextNode {
  type: "text";
  text: string;
}

export interface ElementNode {
  type: "element";
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
}

export type HtmlNode = TextNode | ElementNode;

export class HtmlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HtmlError";
  }
}

export const MAX_HTML_BYTES = 10 * 1024 * 1024;
const MAX_DEPTH = 120;
const MAX_NODES = 400_000;

const VOID = new Set([
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
  "source",
  "track",
  "wbr"
]);
const RAW_TEXT = new Set(["script", "style"]);

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  copy: "©",
  reg: "®",
  trade: "™",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  times: "×",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  deg: "°",
  plusmn: "±"
};

export function decodeEntities(text: string): string {
  if (!text.includes("&")) return text;
  return text.replace(/&(#x[0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{2,8});/g, (m, body: string) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      if (!Number.isFinite(code) || code === 0 || code > 0x10ffff) return "�";
      if (code >= 0xd800 && code <= 0xdfff) return "�";
      return String.fromCodePoint(code);
    }
    return NAMED[body] ?? m;
  });
}

function isSpace(c: string) {
  return c === " " || c === "\n" || c === "\t" || c === "\r" || c === "\f";
}

export function parseHtml(html: string): ElementNode {
  if (html.length > MAX_HTML_BYTES) {
    throw new HtmlError("the note is larger than the print limit");
  }
  const root: ElementNode = { type: "element", tag: "#root", attrs: {}, children: [] };
  const stack: ElementNode[] = [root];
  let nodes = 0;
  let i = 0;
  const n = html.length;

  const addText = (raw: string) => {
    if (raw === "") return;
    const top = stack[stack.length - 1];
    top.children.push({ type: "text", text: decodeEntities(raw) });
    if (++nodes > MAX_NODES) throw new HtmlError("the note has too many elements");
  };

  while (i < n) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      addText(html.slice(i));
      break;
    }
    if (lt > i) addText(html.slice(i, lt));
    i = lt;
    if (html.startsWith("<!--", i)) {
      const end = html.indexOf("-->", i + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (html[i + 1] === "!" || html[i + 1] === "?") {
      const end = html.indexOf(">", i);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (html[i + 1] === "/") {
      const end = html.indexOf(">", i);
      if (end === -1) break;
      const name = html.slice(i + 2, end).trim().toLowerCase();
      i = end + 1;
      let depth = stack.length - 1;
      while (depth > 0 && stack[depth].tag !== name) depth--;
      if (depth > 0) stack.length = depth;
      continue;
    }
    const tagMatch = /^<([a-zA-Z][a-zA-Z0-9-]*)/.exec(html.slice(i, i + 64));
    if (!tagMatch) {
      addText("<");
      i += 1;
      continue;
    }
    const tag = tagMatch[1].toLowerCase();
    let j = i + tagMatch[0].length;
    const attrs: Record<string, string> = {};
    let selfClosing = false;
    for (;;) {
      while (j < n && isSpace(html[j])) j++;
      if (j >= n) break;
      if (html[j] === ">") {
        j++;
        break;
      }
      if (html[j] === "/" ) {
        if (html[j + 1] === ">") {
          selfClosing = true;
          j += 2;
          break;
        }
        j++;
        continue;
      }
      let k = j;
      while (k < n && !isSpace(html[k]) && html[k] !== "=" && html[k] !== ">" && html[k] !== "/") k++;
      const name = html.slice(j, k).toLowerCase();
      j = k;
      while (j < n && isSpace(html[j])) j++;
      let value = "";
      if (html[j] === "=") {
        j++;
        while (j < n && isSpace(html[j])) j++;
        const quote = html[j];
        if (quote === '"' || quote === "'") {
          const end = html.indexOf(quote, j + 1);
          const stop = end === -1 ? n : end;
          value = html.slice(j + 1, stop);
          j = stop + 1;
        } else {
          let e = j;
          while (e < n && !isSpace(html[e]) && html[e] !== ">") e++;
          value = html.slice(j, e);
          j = e;
        }
      }
      if (name && !(name in attrs)) attrs[name] = decodeEntities(value);
    }
    i = j;
    const element: ElementNode = { type: "element", tag, attrs, children: [] };
    if (++nodes > MAX_NODES) throw new HtmlError("the note has too many elements");
    stack[stack.length - 1].children.push(element);
    if (VOID.has(tag) || selfClosing) continue;
    if (RAW_TEXT.has(tag)) {
      const close = html.toLowerCase().indexOf(`</${tag}`, i);
      const end = close === -1 ? n : close;
      i = end;
      continue;
    }
    if (stack.length >= MAX_DEPTH) throw new HtmlError("the note is nested too deeply");
    stack.push(element);
  }
  return root;
}

export function textContent(node: HtmlNode): string {
  if (node.type === "text") return node.text;
  if (node.tag === "br") return "\n";
  return node.children.map(textContent).join("");
}

export function classesOf(node: ElementNode): string[] {
  return (node.attrs.class ?? "").split(/\s+/).filter(Boolean);
}
