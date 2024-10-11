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

import { Node } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import type { CodeBlockAttributes } from "./code-block.js";

export type CodeLine = {
  index: number;
  from: number;
  to: number;
  length: number;
  text: (length?: number) => string;
};

export type CaretPosition = {
  column: number;
  line: number;
  selected?: number;
  total: number;
  from: number;
};

export function toCodeLines(code: string, pos: number): CodeLine[] {
  const positions: CodeLine[] = [];

  let start = 0;
  let from = pos + 1;
  let index = 0;
  while (start <= code.length) {
    let end = code.indexOf("\n", start);
    if (end <= -1) end = code.length;

    const lineLength = end - start;
    const to = from + lineLength;
    const lineStart = start;
    positions.push({
      index,
      length: lineLength,
      from,
      to,
      text: (length) => {
        return code.slice(
          lineStart,
          length ? lineStart + length : lineStart + lineLength
        );
      }
    });

    from = to + 1;
    start = end + 1;
    ++index;
  }
  return positions;
}

export function toCaretPosition(
  selection: Selection,
  lines?: CodeLine[]
): CaretPosition | undefined {
  const { $from, $to, $head } = selection;
  if ($from.parent.type.name !== "codeblock") return;
  lines = lines || getLines($from.parent);

  for (const line of lines) {
    if ($head.pos >= line.from && $head.pos <= line.to) {
      const lineLength = line.length + 1;
      return {
        line: line.index + 1,
        column: lineLength - (line.to - $head.pos),
        selected: $to.pos - $from.pos,
        total: lines.length,
        from: line.from
      };
    }
  }
  return;
}

export function getLines(node: Node) {
  const { lines } = node.attrs as CodeBlockAttributes;
  return lines || [];
}
