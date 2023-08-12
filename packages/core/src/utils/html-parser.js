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

export const parseHTML = (input) =>
  new globalThis.DOMParser().parseFromString(
    wrapIntoHTMLDocument(input),
    "text/html"
  );

export function getDummyDocument() {
  const doc = parseHTML("<div></div>");
  return doc;
}

export function getInnerText(element) {
  return decodeHTML5(element.innerText || element.textContent);
}

function wrapIntoHTMLDocument(input) {
  if (typeof input !== "string") return input;
  if (input.includes("<body>")) return input;

  return `<!doctype html><html lang="en"><head><title>Document Fragment</title></head><body>${input}</body></html>`;
}

export function extractFirstParagraph(html) {
  let text = "";
  try {
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
            parser.reset();
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
  } catch (e) {}
  return text;
}
