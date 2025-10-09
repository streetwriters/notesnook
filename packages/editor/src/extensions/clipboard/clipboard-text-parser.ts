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

import { ResolvedPos, Slice } from "@tiptap/pm/model";
import { encodeNonAsciiHTML } from "entities";
import { ClipboardDOMParser } from "./clipboard-dom-parser.js";
import { EditorView } from "@tiptap/pm/view";
import { markdowntoHTML } from "@notesnook-importer/core/dist/src/utils/to-html.js";

export function clipboardTextParser(
  text: string,
  $context: ResolvedPos,
  plain: boolean,
  view: EditorView
): Slice {
  if (!plain && isProbablyMarkdown(text)) {
    const node = ClipboardDOMParser.fromSchema(view.state.schema).parse(
      new DOMParser().parseFromString(
        markdowntoHTML(text, { allowDangerousHtml: false }),
        "text/html"
      ),
      {
        context: $context
      }
    );
    return node.slice(0);
  }

  const doc = new DOMParser().parseFromString(
    convertTextToHTML(text),
    "text/html"
  );
  return ClipboardDOMParser.fromSchema(view.state.schema).parseSlice(doc, {
    preserveWhitespace: "full",
    context: $context
  });
}

export function convertTextToHTML(src: string) {
  return src
    .split(/\r\n|\n/)
    .map((line) =>
      line
        ? `<p data-spacing="single">${encodeLine(line)}</p>`
        : `<p data-spacing="single"></p>`
    )
    .join("");
}

function encodeLine(line: string) {
  line = encodeNonAsciiHTML(line);
  line = line.replace(/(^ +)|( {2,})/g, (sub, ...args) => {
    const [starting, inline] = args;
    if (starting) return "&nbsp;".repeat(starting.length);
    if (inline) return "&nbsp;".repeat(inline.length);
    return sub;
  });
  return line;
}

interface MarkdownPattern {
  pattern: RegExp;
  score: number;
  type: string;
}

const DEFINITE_PATTERNS: MarkdownPattern[] = [
  { pattern: /^[\t ]*#{1,6}\s+\S/, score: 0, type: "header" },
  { pattern: /^\s*[-*+]\s+\[[ x]\]/, score: 0, type: "task" },
  { pattern: /^\|.+\|.+\|$/, score: 0, type: "table" },
  { pattern: /^[\t ]*>\s+.+/, score: 0, type: "blockquote" },
  { pattern: /!\[[^\]]+\]\([^)\s]+(?:\s+"[^"]*")?\)/, score: 0, type: "image" }
];

const MARKDOWN_PATTERNS: MarkdownPattern[] = [
  // Strong indicators
  { pattern: /^[\t ]*#{1,6}\s+\S/m, score: 3, type: "header" },
  { pattern: /^`{3}.*\n[\s\S]*?\n`{3}$/m, score: 3, type: "codeblock" },
  { pattern: /^\s*[-*+]\s+\[[ x]\]/m, score: 3, type: "tasklist" },

  // Medium indicators
  { pattern: /\[[^\]]+\]\([^)\s]+(?:\s+"[^"]*")?\)/, score: 2, type: "link" },
  { pattern: /^\s*\[[^\]]+\]:\s+\S+/m, score: 2, type: "reference" },
  { pattern: /\[[^\]]+\]\[\w*\]/, score: 2, type: "referenceLink" },
  { pattern: /^[\t ]*>\s+.+/m, score: 2, type: "blockquote" },
  { pattern: /^[-*_]{3,}/m, score: 2, type: "hr" },
  { pattern: /^\|.+\|.+\|$/m, score: 2, type: "table" },
  { pattern: /^\s{0,3}[-*+]\s+\S/m, score: 2, type: "unorderedList" },
  { pattern: /^\s*\d+\.\s+\S/m, score: 2, type: "orderedList" },
  { pattern: /\$\$.+\$\$/m, score: 2, type: "math" },
  { pattern: /\{:.+\}/m, score: 2, type: "attribute" },
  { pattern: /\[:(.+?)\]/, score: 2, type: "footnote" },

  // Weak indicators
  { pattern: /(^|[^*])\*\*([^*\n]+)\*\*(?!\*)/m, score: 1, type: "bold" },
  { pattern: /(^|[^*])\*([^*\n]+)\*(?!\*)/m, score: 1, type: "italic" },
  { pattern: /(^|[^_])__([^_\n]+)__(?!_)/m, score: 1, type: "boldUnderscore" },
  { pattern: /(^|[^_])_([^_\n]+)_(?!_)/m, score: 1, type: "italicUnderscore" },
  { pattern: /`[^`\n]+`/m, score: 1, type: "inlineCode" },
  { pattern: /~~[^~\n]+~~/m, score: 1, type: "strikethrough" },

  { pattern: /!\[[^\]]+\]\([^)\s]+(?:\s+"[^"]*")?\)/, score: 1, type: "image" }
];

const NEGATIVE_PATTERNS: MarkdownPattern[] = [
  { pattern: /<html>/, score: -5, type: "html" },
  { pattern: /<?xml/, score: -5, type: "xml" },
  { pattern: /^\s*[0-9,.]+$/, score: -3, type: "numbers" },
  {
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    score: -5,
    type: "email"
  },
  { pattern: /^https?:\/\/\S+$/, score: -3, type: "url" },
  { pattern: /^\s*[{[\]},;]\s*$/, score: -3, type: "punctuation" },
  { pattern: /^(Subject|From|To|Date):/, score: -4, type: "emailHeader" },
  { pattern: /^[A-Z]{2,}:/, score: -2, type: "capsHeader" },
  { pattern: /<script[\s\S]*?<\/script>/i, score: -4, type: "script" },
  { pattern: /<style[\s\S]*?<\/style>/i, score: -4, type: "style" }
];

export function isProbablyMarkdown(text: string, debug = false) {
  function log(...args: any[]) {
    if (debug) console.log(...args);
  }

  // Check definite patterns first
  const definiteMatch = DEFINITE_PATTERNS.find((p) => p.pattern.test(text));
  if (definiteMatch) {
    log("Definite markdown match:", definiteMatch.type);
    return true;
  }

  let score = 0;
  const matches: string[] = [];
  const lines = text.split("\n");

  function pushMatch(match: string) {
    if (debug) matches.push(match);
  }

  // Check positive patterns
  for (const pattern of MARKDOWN_PATTERNS) {
    const matchCount = getPatternMatches(text, pattern.pattern);
    if (matchCount > 0) {
      const patternScore = pattern.score * matchCount;
      score += patternScore;
      pushMatch(`+${patternScore} ${pattern.type} (${matchCount} matches)`);
    }
  }

  // Check negative patterns
  for (const pattern of NEGATIVE_PATTERNS) {
    const matchCount = getPatternMatches(text, pattern.pattern);
    if (matchCount > 0) {
      const patternScore = pattern.score * matchCount;
      score += patternScore;
      pushMatch(`${patternScore} ${pattern.type} (${matchCount} matches)`);
    }
  }

  // Structure indicators
  if (lines.length > 1) {
    score += 1;
    pushMatch("+1 multiline");
  }
  if (/\n\n/.test(text)) {
    score += 1;
    pushMatch("+1 paragraphs");
  }
  if (/^\s{1,4}[^\s]/m.test(text)) {
    score += 1;
    pushMatch("+1 indentation");
  }

  // Check formatting consistency
  let consistentFormatting = 0;
  let prevLineIndent = -1;

  for (const line of lines) {
    const indent = line.search(/\S/);
    if (prevLineIndent !== -1) {
      if (indent === prevLineIndent || indent === prevLineIndent + 2) {
        consistentFormatting++;
      }
    }
    prevLineIndent = indent;
  }

  if (consistentFormatting > lines.length / 2) {
    score += 2;
    pushMatch("+2 consistentFormatting");
  }

  const threshold = text.length > 100 ? 4 : 3;
  const confidence = Math.min(
    100,
    Math.max(0, score * (text.length > 100 ? 8 : 12))
  );

  if (debug) {
    const result = {
      score,
      isLikelyMarkdown: score > threshold,
      confidence,
      details: {
        length: text.length,
        lines: lines.length,
        consistentFormatting,
        threshold,
        matches
      }
    };
    log("Markdown detection result:", result);
  }
  return score > threshold;
}

function getPatternMatches(text: string, pattern: RegExp) {
  const matches = text.match(new RegExp(pattern, "gm")) || [];
  return matches.length;
}
