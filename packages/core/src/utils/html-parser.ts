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

import { decodeHTML5 } from "entities";
import { Parser } from "htmlparser2";

export const parseHTML = (input: string) =>
  "DOMParser" in globalThis
    ? new globalThis.DOMParser().parseFromString(
        wrapIntoHTMLDocument(input),
        "text/html"
      )
    : null;

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

export function extractText(html: string, retainTags?: string[]) {
  let text = "";
  const parser = new Parser(
    {
      ontext: (data) => (text += data),
      onopentag(name) {
        if (retainTags?.includes(name)) text += `<${name}>`;
      },
      onclosetag(name) {
        if (retainTags?.includes(name)) text += `</${name}>`;
      }
    },
    {
      lowerCaseTags: false
    }
  );
  parser.end(html);
  return text;
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
      onopentag(name) {
        if (!INLINE_TAGS.includes(name) && name !== matchTagName) {
          openedTag = name;
          text = "";
          hasMatches = false;
        }
        if (name === matchTagName) {
          hasMatches = true;
          text += `<${name}>`;
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
      lowerCaseTags: false
    }
  );
  parser.end(html);
  if (hasMatches && text) matches.push(text);

  return matches;
}
