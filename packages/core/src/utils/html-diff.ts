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

import { Parser } from "htmlparser2";

const ALLOWED_ATTRIBUTES = ["href", "src", "data-hash"];

// Tags whose presence, absence, or nesting order constitutes a semantic
// difference — tracked as tokens so structural/formatting changes are detected.
const SEMANTIC_TAGS = new Set([
  // block structure
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "ul",
  "ol",
  "li",
  "table",
  "tr",
  "td",
  "th",
  "thead",
  "tbody",
  "hr",
  // inline formatting
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "mark",
  "sup",
  "sub",
  "code",
  "a"
]);

// Void elements cannot have children. We emit only an open token for them so
// empty-pair removal never accidentally strips them (e.g. <hr> is meaningful).
// <br> is intentionally absent from SEMANTIC_TAGS altogether: it is a void
// element used as an empty-paragraph placeholder in TipTap, and meaningful
// line breaks are already detectable via separate text node tokens.
const VOID_ELEMENTS = new Set(["hr"]);

export function isHTMLEqual(one: unknown, two: unknown) {
  if (typeof one !== "string" || typeof two !== "string") return false;

  return toDiffable(one) === toDiffable(two);
}

/**
 * Repeatedly removes adjacent open/close pairs that have no content between
 * them, e.g. ["<p>", "</p>"] → []. Iterates until stable so that nested
 * empty tags collapse fully: <ul><li></li></ul> → [].
 */
function removeEmptyTagPairs(tokens: string[]): string[] {
  let prevLength = -1;
  while (tokens.length !== prevLength) {
    prevLength = tokens.length;
    const result: string[] = [];
    let i = 0;
    while (i < tokens.length) {
      if (
        i + 1 < tokens.length &&
        tokens[i][0] === "<" &&
        tokens[i][1] !== "/" &&
        tokens[i + 1] === `</${tokens[i].slice(1)}`
      ) {
        i += 2; // skip the empty pair
      } else {
        result.push(tokens[i]);
        i++;
      }
    }
    tokens = result;
  }
  return tokens;
}

function toDiffable(html: string) {
  const tokens: string[] = [];
  const parser = new Parser(
    {
      ontext: (data) => {
        const trimmed = data.trim();
        if (trimmed) tokens.push(trimmed);
      },
      onopentag: (name, attr) => {
        if (SEMANTIC_TAGS.has(name)) tokens.push(`<${name}>`);
        for (const key of ALLOWED_ATTRIBUTES) {
          const value = attr[key];
          if (!value) continue;
          tokens.push(value.trim());
        }
      },
      onclosetag: (name) => {
        // Void elements never have children so their close token would always
        // form an empty pair and be stripped — skip it entirely.
        if (VOID_ELEMENTS.has(name)) return;
        if (SEMANTIC_TAGS.has(name)) tokens.push(`</${name}>`);
      }
    },
    { lowerCaseTags: true }
  );
  parser.end(html);
  // \x00 is used as separator — it cannot appear in HTML content, so
  // "foo" + "bar" in separate nodes can never collide with "foobar" in one.
  return removeEmptyTagPairs(tokens).join("\x00");
}
