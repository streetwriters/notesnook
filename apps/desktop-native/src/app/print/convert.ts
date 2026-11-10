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

import { color, literal, parseStyle, pointsOf, textRun } from "./escape";
import {
  ElementNode,
  HtmlError,
  HtmlNode,
  classesOf,
  parseHtml,
  textContent
} from "./html";
import { loadMathConverter, toTypstMath, type MathConverter } from "./math";
import {
  ConvertError,
  ConvertedNote,
  ImageData,
  LIMITS,
  PrintDocumentOptions
} from "./types";

type Item = { kind: "text"; text: string } | { kind: "code"; code: string };

interface Context {
  options: PrintDocumentOptions;
  files: Record<string, Uint8Array>;
  warnings: string[];
  images: number;
  imageBytes: number;
  math: MathConverter | null;
}

const IGNORED_TAGS = new Set([
  "head",
  "title",
  "meta",
  "link",
  "base",
  "noscript",
  "template"
]);

const BLOCK_TAGS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "table",
  "pre",
  "blockquote",
  "hr",
  "iframe",
  "audio",
  "video",
  "section",
  "article",
  "header",
  "footer",
  "figure"
]);

const CALLOUT_COLORS: Record<string, string> = {
  info: "#3b82f6",
  note: "#6b7280",
  tip: "#10b981",
  success: "#10b981",
  warning: "#f59e0b",
  caution: "#f59e0b",
  danger: "#ef4444",
  error: "#ef4444",
  important: "#8b5cf6",
  question: "#14b8a6"
};

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/webp": "webp"
};

function render(items: Item[]): string {
  const out: Item[] = [];
  for (const item of items) {
    if (item.kind === "text") {
      let text = item.text;
      const last = out[out.length - 1];
      if (
        text.startsWith(" ") &&
        last?.kind === "text" &&
        last.text.endsWith(" ")
      ) {
        text = text.slice(1);
      }
      if (text === "") continue;
      if (last?.kind === "text") last.text += text;
      else out.push({ kind: "text", text });
    } else out.push(item);
  }
  while (out[0]?.kind === "text") {
    out[0].text = out[0].text.replace(/^ +/, "");
    if (out[0].text === "") out.shift();
    else break;
  }
  while (out[out.length - 1]?.kind === "text") {
    const last = out[out.length - 1] as { kind: "text"; text: string };
    last.text = last.text.replace(/ +$/, "");
    if (last.text === "") out.pop();
    else break;
  }
  return out
    .map((i) => (i.kind === "text" ? textRun(i.text) : i.code))
    .join("");
}

function wrap(fn: string, items: Item[]): Item[] {
  const body = render(items);
  return body === "" ? [] : [{ kind: "code", code: `#${fn}[${body}]` }];
}

function collapse(text: string): string {
  return text.replace(/[ \t\r\n\f]+/g, " ");
}

async function inlineNodes(nodes: HtmlNode[], ctx: Context): Promise<Item[]> {
  const out: Item[] = [];
  for (const node of nodes) out.push(...(await inlineNode(node, ctx)));
  return out;
}

function styled(node: ElementNode, items: Item[]): Item[] {
  const style = parseStyle(node.attrs.style);
  let result = items;
  const fill = color(style.color);
  const size = pointsOf(style["font-size"]);
  const family = style["font-family"]
    ?.split(",")[0]
    ?.trim()
    .replace(/^["']|["']$/g, "");
  const args: string[] = [];
  if (fill) args.push(`fill: ${fill}`);
  if (size && size < 200) args.push(`size: ${size.toFixed(1)}pt`);
  if (family && family.length < 80) args.push(`font: ${literal(family)}`);
  if (args.length) result = wrap(`text(${args.join(", ")})`, result);
  const background = color(style["background-color"] ?? style.background);
  if (background) result = wrap(`highlight(fill: ${background})`, result);
  return result;
}

async function inlineNode(node: HtmlNode, ctx: Context): Promise<Item[]> {
  if (node.type === "text") {
    const text = collapse(node.text);
    return text === "" ? [] : [{ kind: "text", text }];
  }
  const tag = node.tag;
  if (IGNORED_TAGS.has(tag)) return [];
  const classes = classesOf(node);
  switch (tag) {
    case "br":
      return [{ kind: "code", code: "#linebreak()" }];
    case "strong":
    case "b":
      return wrap("strong", await inlineNodes(node.children, ctx));
    case "em":
    case "i":
      return wrap("emph", await inlineNodes(node.children, ctx));
    case "u":
      return wrap("underline", await inlineNodes(node.children, ctx));
    case "s":
    case "strike":
    case "del":
      return wrap("strike", await inlineNodes(node.children, ctx));
    case "sub":
      return wrap("sub", await inlineNodes(node.children, ctx));
    case "sup":
      return wrap("super", await inlineNodes(node.children, ctx));
    case "mark": {
      const fill =
        color(
          node.attrs["data-color"] ??
            parseStyle(node.attrs.style)["background-color"]
        ) ?? 'rgb("#fff59d")';
      return wrap(
        `highlight(fill: ${fill})`,
        await inlineNodes(node.children, ctx)
      );
    }
    case "code": {
      const text = textContent(node);
      return text === ""
        ? []
        : [
            {
              kind: "code",
              code: `#box(fill: luma(240), inset: (x: 2pt), outset: (y: 2pt), radius: 2pt)[#raw(${literal(
                text
              )})]`
            }
          ];
    }
    case "a": {
      const href = (node.attrs.href ?? "").trim();
      const inner = await inlineNodes(node.children, ctx);
      if (!href || /^\s*javascript:/i.test(href)) return inner;
      const body = render(inner);
      return body === ""
        ? []
        : [{ kind: "code", code: `#link(${literal(href)})[${body}]` }];
    }
    case "img":
      return [{ kind: "code", code: await image(node, ctx, true) }];
    case "span": {
      if (classes.includes("math-inline"))
        return [mathItem(textContent(node), false, ctx)];
      if (node.attrs["data-hash"] !== undefined)
        return [{ kind: "code", code: attachment(node, ctx) }];
      return styled(node, await inlineNodes(node.children, ctx));
    }
    case "input":
      return [];
    default: {
      if (BLOCK_TAGS.has(tag)) return inlineNodes(node.children, ctx);
      return styled(node, await inlineNodes(node.children, ctx));
    }
  }
}

function mathItem(latex: string, display: boolean, ctx: Context): Item {
  const converted =
    ctx.options.math === "raw" ? undefined : toTypstMath(latex, ctx.math);
  if (converted !== undefined) {
    return {
      kind: "code",
      code: display ? `$ ${converted} $` : `$${converted}$`
    };
  }
  ctx.warnings.push("math-not-converted");
  const raw = `#raw(${literal(latex.trim())}${display ? ", block: true" : ""})`;
  if (!display) {
    return {
      kind: "code",
      code: `#box(fill: rgb("#fff3cd"), inset: (x: 3pt), radius: 2pt)[${raw}]`
    };
  }
  return {
    kind: "code",
    code: `#block(fill: rgb("#fff3cd"), stroke: (dash: "dashed", paint: luma(160)), inset: 8pt, width: 100%)[#text(size: 0.8em, fill: luma(110))[${textRun(
      "LaTeX (not converted)"
    )}] \\ ${raw}]`
  };
}

function attachment(node: ElementNode, ctx: Context): string {
  const hash = node.attrs["data-hash"] ?? "";
  const described = ctx.options.describeAttachment?.(hash);
  const name = node.attrs["data-filename"] ?? described?.name ?? "attachment";
  const size = Number(node.attrs["data-size"] ?? described?.size ?? NaN);
  const label = Number.isFinite(size) ? `${name} (${formatSize(size)})` : name;
  return `#box(fill: luma(240), inset: (x: 4pt, y: 2pt), radius: 2pt)[#text(size: 0.9em)[${textRun(
    "Attachment: " + label
  )}]]`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function image(
  node: ElementNode,
  ctx: Context,
  inline: boolean
): Promise<string> {
  const alt = node.attrs.alt ?? "";
  const placeholder = (why: string) => {
    ctx.warnings.push(`image-${why}`);
    return `#text(fill: luma(120))[${textRun(
      `[image${alt ? ": " + alt : ""}]`
    )}]`;
  };
  if (!ctx.options.resolveImage) return placeholder("unavailable");
  if (ctx.images >= LIMITS.maxImages) return placeholder("limit");
  let data: ImageData | null;
  try {
    data = await ctx.options.resolveImage({
      src: node.attrs.src,
      hash: node.attrs["data-hash"],
      alt
    });
  } catch {
    data = null;
  }
  if (!data) return placeholder("missing");
  const extension = IMAGE_TYPES[data.mime.toLowerCase()];
  if (!extension) return placeholder("type");
  if (data.bytes.byteLength > LIMITS.maxImageBytes) return placeholder("large");
  const style = parseStyle(node.attrs.style);
  const shown =
    pointsOf(node.attrs.width) ??
    pointsOf(style.width) ??
    (data.width ? data.width * 0.75 : 300);
  const widthPt = Math.min(Math.max(shown, 8), 2000);
  const dpi = ctx.options.dpi ?? 200;
  const targetPixels = Math.ceil((widthPt / 72) * dpi);
  if (
    ctx.options.prepareImage &&
    data.width &&
    data.width > targetPixels * 1.25 &&
    extension !== "svg"
  ) {
    try {
      data = await ctx.options.prepareImage(data, { maxWidth: targetPixels });
    } catch {
      ctx.warnings.push("image-not-downscaled");
    }
  }
  const finalExt = IMAGE_TYPES[data.mime.toLowerCase()] ?? extension;
  if (ctx.imageBytes + data.bytes.byteLength > LIMITS.maxTotalImageBytes)
    return placeholder("total");
  const name = `img-${ctx.images}.${finalExt}`;
  ctx.images += 1;
  ctx.imageBytes += data.bytes.byteLength;
  ctx.files[name] = data.bytes;
  const body = `#layout(size => image(${literal(
    name
  )}, width: calc.min(${widthPt.toFixed(1)}pt, size.width), fit: "contain"))`;
  return inline ? `#box[${body}]` : body;
}

function alignOf(node: ElementNode): string | undefined {
  const style = parseStyle(node.attrs.style);
  const value = (style["text-align"] ?? node.attrs.align ?? "").toLowerCase();
  if (value === "center") return "center";
  if (value === "right" || value === "end") return "right";
  if (value === "left" || value === "start") return "left";
  return undefined;
}

function directionOf(node: ElementNode): "ltr" | "rtl" | undefined {
  const value = (
    node.attrs.dir ??
    parseStyle(node.attrs.style).direction ??
    ""
  ).toLowerCase();
  return value === "rtl" ? "rtl" : value === "ltr" ? "ltr" : undefined;
}

function paragraphWrap(node: ElementNode, body: string): string {
  let out = body;
  const dir = directionOf(node);
  if (dir) out = `#text(dir: ${dir})[${out}]`;
  const align = alignOf(node);
  if (align) out = `#align(${align})[${out}]`;
  return out;
}

async function blocks(nodes: HtmlNode[], ctx: Context): Promise<string[]> {
  const out: string[] = [];
  let loose: HtmlNode[] = [];
  const flush = async () => {
    if (loose.length === 0) return;
    const body = render(await inlineNodes(loose, ctx));
    loose = [];
    if (body !== "") out.push(body);
  };
  for (const node of nodes) {
    if (node.type === "element" && IGNORED_TAGS.has(node.tag)) continue;
    if (node.type === "element" && BLOCK_TAGS.has(node.tag)) {
      await flush();
      out.push(...(await block(node, ctx)));
    } else if (
      node.type === "element" &&
      node.tag === "span" &&
      node.attrs["data-hash"] === undefined &&
      classesOf(node).includes("math-block")
    ) {
      await flush();
      out.push(mathBlock(node, ctx));
    } else loose.push(node);
  }
  await flush();
  return out;
}

function mathBlock(node: ElementNode, ctx: Context): string {
  const item = mathItem(textContent(node), true, ctx);
  return item.kind === "code" ? item.code : "";
}

async function content(nodes: HtmlNode[], ctx: Context): Promise<string> {
  return (await blocks(nodes, ctx)).join("\n\n");
}

async function listItems(
  list: ElementNode,
  ctx: Context,
  task: boolean
): Promise<string[]> {
  const items: string[] = [];
  for (const child of list.children) {
    if (child.type !== "element" || child.tag !== "li") continue;
    const body = (await content(child.children, ctx)) || "#h(0pt)";
    if (task) {
      const checked = classesOf(child).includes("checked");
      const box = checked
        ? `#box(width: 0.85em, height: 0.85em, fill: luma(60), radius: 2pt, baseline: 0.1em)[#align(center + horizon)[#text(size: 0.65em, fill: white, font: "DejaVu Sans Mono")[${textRun(
            "✓"
          )}]]]`
        : `#box(width: 0.85em, height: 0.85em, stroke: 0.8pt + luma(60), radius: 2pt, baseline: 0.1em)`;
      items.push(`[${box} #h(0.4em) ${body}]`);
    } else items.push(`[${body}]`);
  }
  return items;
}

async function block(node: ElementNode, ctx: Context): Promise<string[]> {
  const tag = node.tag;
  const classes = classesOf(node);
  switch (tag) {
    case "p": {
      const body = render(await inlineNodes(node.children, ctx));
      return [body === "" ? "#v(0.8em)" : paragraphWrap(node, body)];
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const body = render(await inlineNodes(node.children, ctx));
      return body === ""
        ? []
        : [paragraphWrap(node, `#heading(level: ${tag[1]})[${body}]`)];
    }
    case "ul":
    case "ol": {
      const task =
        classes.includes("checklist") || classes.includes("task-list");
      const items = await listItems(node, ctx, task);
      if (items.length === 0) return [];
      if (task)
        return [`#list(marker: none, tight: false, ${items.join(", ")})`];
      if (tag === "ol") {
        const start = parseInt(node.attrs.start ?? "1", 10);
        const first =
          Number.isFinite(start) && start >= 0 && start < 100000 ? start : 1;
        return [`#enum(start: ${first}, tight: false, ${items.join(", ")})`];
      }
      return [`#list(tight: false, ${items.join(", ")})`];
    }
    case "li":
      return blocks(node.children, ctx);
    case "blockquote": {
      const body = await content(node.children, ctx);
      return body === "" ? [] : [`#quote(block: true)[${body}]`];
    }
    case "hr":
      return ["#line(length: 100%, stroke: 0.5pt + luma(180))"];
    case "pre": {
      const code = textContent(node).replace(/\n$/, "");
      const lang =
        classes.find((c) => c.startsWith("language-"))?.slice(9) ??
        (node.children[0]?.type === "element"
          ? classesOf(node.children[0])
              .find((c) => c.startsWith("language-"))
              ?.slice(9)
          : undefined);
      const language =
        lang && /^[a-zA-Z0-9+#_-]{1,30}$/.test(lang) && lang !== "text"
          ? `, lang: ${literal(lang)}`
          : "";
      return [
        `#block(fill: luma(246), inset: 8pt, radius: 3pt, width: 100%, breakable: true)[#raw(${literal(
          code
        )}, block: true${language})]`
      ];
    }
    case "table":
      return [await table(node, ctx)];
    case "iframe":
    case "audio":
    case "video": {
      const src = node.attrs.src ?? node.attrs["data-src"];
      const label = textRun(`[${tag === "iframe" ? "embedded content" : tag}]`);
      return [
        src
          ? `#link(${literal(src)})[${label}]`
          : `#text(fill: luma(120))[${label}]`
      ];
    }
    case "div": {
      if (classes.includes("callout")) return [await callout(node, ctx)];
      if (classes.includes("math-block")) return [mathBlock(node, ctx)];
      return blocks(node.children, ctx);
    }
    default:
      return blocks(node.children, ctx);
  }
}

async function callout(node: ElementNode, ctx: Context): Promise<string> {
  const type = (node.attrs["data-callout-type"] ?? "info").toLowerCase();
  const accent = CALLOUT_COLORS[type] ?? "#6b7280";
  const body = await content(node.children, ctx);
  return `#block(fill: rgb("${accent}").lighten(88%), stroke: (left: 3pt + rgb("${accent}")), inset: 10pt, radius: 3pt, width: 100%, breakable: true)[${body}]`;
}

async function table(node: ElementNode, ctx: Context): Promise<string> {
  const rows: ElementNode[] = [];
  const collect = (parent: ElementNode) => {
    for (const child of parent.children) {
      if (child.type !== "element") continue;
      if (child.tag === "tr") rows.push(child);
      else if (["thead", "tbody", "tfoot"].includes(child.tag)) collect(child);
    }
  };
  collect(node);
  if (rows.length === 0) return "";
  let columns = 1;
  const cells: string[][] = [];
  const headerRow: boolean[] = [];
  for (const row of rows) {
    let width = 0;
    const rowCells: string[] = [];
    let headers = 0;
    let count = 0;
    for (const cell of row.children) {
      if (cell.type !== "element" || (cell.tag !== "td" && cell.tag !== "th"))
        continue;
      const colspan = Math.min(
        Math.max(parseInt(cell.attrs.colspan ?? "1", 10) || 1, 1),
        50
      );
      const rowspan = Math.min(
        Math.max(parseInt(cell.attrs.rowspan ?? "1", 10) || 1, 1),
        200
      );
      width += colspan;
      count += 1;
      if (cell.tag === "th") headers += 1;
      const body = (await content(cell.children, ctx)) || "#h(0pt)";
      const args = [
        colspan > 1 ? `colspan: ${colspan}` : "",
        rowspan > 1 ? `rowspan: ${rowspan}` : ""
      ].filter(Boolean);
      const bold = cell.tag === "th" ? `#strong[${body}]` : body;
      rowCells.push(
        args.length ? `table.cell(${args.join(", ")})[${bold}]` : `[${bold}]`
      );
    }
    columns = Math.max(columns, width);
    cells.push(rowCells);
    headerRow.push(count > 0 && headers === count);
  }
  const head = headerRow[0] && cells[0].length > 0;
  const lines = cells.map((row, index) =>
    head && index === 0 ? `table.header(${row.join(", ")})` : row.join(", ")
  );
  const spec = Array.from({ length: Math.min(columns, 60) }, () => "1fr").join(
    ", "
  );
  return `#table(columns: (${spec}), stroke: 0.5pt + luma(180), inset: 6pt, ${lines
    .filter(Boolean)
    .join(",\n  ")})`;
}

function preamble(options: PrintDocumentOptions): string {
  const fonts = (options.bodyFonts ?? []).map(literal);
  const body = [...fonts, literal("DejaVu Sans Mono")].join(", ");
  const monoList = [...(options.monoFonts ?? []), "DejaVu Sans Mono"];
  const mono = `(${monoList.map(literal).join(", ")})`;
  const paper = options.paper ?? "a4";
  const margin = /^\d+(\.\d+)?(cm|mm|pt|in)$/.test(options.margin ?? "")
    ? options.margin
    : "2cm";
  const size = Math.min(Math.max(options.fontSize ?? 11, 6), 48);
  const dir = options.direction ?? "ltr";
  return [
    `#set page(paper: ${literal(paper)}, margin: ${margin}, numbering: "1")`,
    `#set text(font: (${body}), size: ${size}pt, dir: ${dir})`,
    `#set par(justify: false, leading: 0.65em, spacing: 0.9em)`,
    `#set list(indent: 0.6em)`,
    `#set enum(indent: 0.6em)`,
    `#show raw: set text(font: ${mono}, size: 0.9em)`,
    `#show heading.where(level: 1): set text(size: 1.7em)`,
    `#show heading.where(level: 2): set text(size: 1.4em)`,
    `#show heading.where(level: 3): set text(size: 1.2em)`,
    `#show heading: set block(above: 1.2em, below: 0.7em)`,
    `#show quote.where(block: true): it => block(inset: (left: 1em), stroke: (left: 2pt + luma(180)), it.body)`,
    `#show link: set text(fill: rgb("#1d4ed8"))`
  ].join("\n");
}

export async function noteToTypst(
  html: string,
  options: PrintDocumentOptions = {}
): Promise<ConvertedNote> {
  let root: ElementNode;
  try {
    root = parseHtml(html);
  } catch (error) {
    if (error instanceof HtmlError)
      throw new ConvertError("html", error.message);
    throw error;
  }
  const ctx: Context = {
    options,
    files: {},
    warnings: [],
    images: 0,
    imageBytes: 0,
    math: options.math === "raw" ? null : await loadMathConverter()
  };
  const parts = [preamble(options)];
  if (options.title) {
    parts.push(
      `#align(center)[#text(size: 1.9em, weight: "bold")[${textRun(
        options.title
      )}]]\n#v(0.5em)`
    );
  }
  parts.push(await content(root.children, ctx));
  const source = parts.join("\n\n") + "\n";
  if (source.length > LIMITS.maxSourceBytes) {
    throw new ConvertError("too-large", "the note is too large to print");
  }
  return { source, files: ctx.files, warnings: [...new Set(ctx.warnings)] };
}
