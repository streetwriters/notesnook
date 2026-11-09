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

/**
 * Every piece of note text reaches the Typst source as a string literal, so no
 * character of a note can ever be read as markup or code. Only backslash,
 * double quote and control characters need escaping inside a literal.
 */
export function literal(text: string): string {
  let out = '"';
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (code < 0x20 || code === 0x7f || code === 0x2028 || code === 0x2029) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\t") out += "\\t";
      else out += `\\u{${code.toString(16)}}`;
    } else if (code >= 0xd800 && code <= 0xdfff) out += "�";
    else out += ch;
  }
  return out + '"';
}

/** Inline text as content: `#"..."` (a space-only run keeps its space). */
export function textRun(text: string): string {
  return text === "" ? "" : `#${literal(text)}`;
}

/** Decodes a literal made by {@link literal} (used by tests). */
export function unliteral(source: string): string {
  let out = "";
  for (let i = 1; i < source.length - 1; i++) {
    const c = source[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const next = source[++i];
    if (next === "n") out += "\n";
    else if (next === "t") out += "\t";
    else if (next === "u") {
      const end = source.indexOf("}", i);
      out += String.fromCodePoint(parseInt(source.slice(i + 2, end), 16));
      i = end;
    } else out += next;
  }
  return out;
}

/** Safe identifiers for the few values that are not text. */
export function color(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.replace(/./g, (c) => c + c);
    return `rgb("#${h}")`;
  }
  const rgb = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(v);
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map((x) => Math.min(255, parseInt(x, 10)));
    const hexOf = (x: number) => x.toString(16).padStart(2, "0");
    return `rgb("#${hexOf(r)}${hexOf(g)}${hexOf(b)}")`;
  }
  const named: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    orange: "#ffa500",
    purple: "#800080",
    gray: "#808080",
    grey: "#808080"
  };
  return named[v] ? `rgb("${named[v]}")` : undefined;
}

export function parseStyle(style: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style) return out;
  for (const part of style.split(";")) {
    const at = part.indexOf(":");
    if (at === -1) continue;
    const key = part.slice(0, at).trim().toLowerCase();
    const value = part.slice(at + 1).trim();
    if (key && value && !(key in out)) out[key] = value;
  }
  return out;
}

export function pointsOf(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const m = /^([\d.]+)\s*(px|pt|em|rem)?$/.exec(value.trim());
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  switch (m[2]) {
    case "pt":
      return n;
    case "em":
    case "rem":
      return n * 12;
    default:
      return n * 0.75;
  }
}
