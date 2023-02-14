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

import { Editor } from "@tiptap/core";

export function getTotalWords(editor: Editor): number {
    const documentText = editor.state.doc.textBetween(
      0,
      editor.state.doc.content.size,
      "\n",
      " "
    );
    return countWords(documentText);
  }

export function countWords(str: string) {
  let count = 0;
  let shouldCount = false;
  let isScript = false;

  for (let i = 0; i < str.length; ++i) {
    const s = str[i];

    if (
      s === " " ||
      s === "\r" ||
      s === "\n" ||
      s === "*" ||
      s === "/" ||
      s === "&" ||
      (isScript = isCJKChar(s))
    ) {
      if (!shouldCount && !isScript) continue;
      ++count;
      shouldCount = false;
    } else {
      shouldCount = true;
    }
  }

  if (shouldCount) ++count;

  return count;
}

// Taken from: https://en.wikipedia.org/wiki/CJK_Unified_Ideographs
const CJK_UNICODE_RANGES = [
  [19968, 40959], // CJK Unified Ideographs                     4E00-9FFF   Common
  [13312, 19903], // CJK Unified Ideographs Extension A         3400-4DBF   Rare
  [131072, 173791], // CJK Unified Ideographs Extension B       20000-2A6DF Rare, historic
  [173824, 177983], // CJK Unified Ideographs Extension C       2A700–2B73F Rare, historic
  [177984, 178207], // CJK Unified Ideographs Extension D       2B740–2B81F Uncommon, some in current use
  [178208, 183983], // CJK Unified Ideographs Extension E       2B820–2CEAF Rare, historic
  [183984, 191471], // CJK Unified Ideographs Extension F       2CEB0–2EBEF  Rare, historic
  [196608, 201551], // CJK Unified Ideographs Extension G       30000–3134F  Rare, historic
  [201552, 205743], // CJK Unified Ideographs Extension H       31350–323AF Rare, historic
  [63744, 64255], // CJK Compatibility Ideographs               F900-FAFF   Duplicates, unifiable variants, corporate characters
  [194560, 195103], // CJK Compatibility Ideographs Supplement  2F800-2FA1F Unifiable variants
  [12032, 12255], // CJK Radicals / Kangxi Radicals             2F00–2FDF
  [11904, 12031], // CJK Radicals Supplement                    2E80–2EFF
  [12288, 12351], // CJK Symbols and Punctuation                3000–303F
  [13056, 13311], // CJK Compatibility                          3300-33FF
  [65072, 65103] // CJK Compatibility Forms                     FE30-FE4F
];

function isCJKChar(char: string) {
  const code = char.charCodeAt(0);
  const isIn = CJK_UNICODE_RANGES.some(
    (range) => code >= range[0] && code <= range[1]
  );
  return isIn;
}
