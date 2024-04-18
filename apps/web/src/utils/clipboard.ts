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

type Formats = {
  "text/html"?: string;
  "text/markdown"?: string;
  "text/plain": string;
};
const COPYABLE_FORMATS = ["text/html", "text/plain"] as const;
export async function writeToClipboard(formats: Formats) {
  if ("ClipboardItem" in window) {
    const items: Record<string, Blob> = Object.fromEntries(
      COPYABLE_FORMATS.filter((f) => !!formats[f]).map((f) => {
        const content = formats[f];
        if (!content) return [];
        return [f, textToBlob(content, f)] as const;
      })
    );
    return navigator.clipboard.write([new ClipboardItem(items)]);
  } else
    return navigator.clipboard.writeText(
      formats["text/markdown"] || formats["text/plain"]
    );
}

function textToBlob(text: string, type: string) {
  return new Blob([new TextEncoder().encode(text)], { type });
}
