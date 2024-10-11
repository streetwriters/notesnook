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

export function clipboardTextParser(
  text: string,
  _$context: ResolvedPos,
  _plain: boolean,
  view: EditorView
): Slice {
  const doc = new DOMParser().parseFromString(
    convertTextToHTML(text),
    "text/html"
  );
  return ClipboardDOMParser.fromSchema(view.state.schema).parseSlice(doc, {
    preserveWhitespace: "full"
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
