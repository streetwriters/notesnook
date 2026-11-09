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

import type { EditorStatistics } from "@ui";

const BLOCK =
  /<\/?(p|div|br|li|ul|ol|h[1-6]|tr|table|pre|blockquote|hr)\b[^>]*>/gi;
const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'"
};

export function htmlToParagraphs(html: string) {
  return html
    .replace(BLOCK, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function getNoteStatistics(html: string | undefined): EditorStatistics {
  const paragraphs = htmlToParagraphs(html ?? "");
  const text = paragraphs.join(" ");
  const words = text.length > 0 ? text.split(/\s+/).length : 0;
  return {
    words: { total: words },
    characters: { total: text.replace(/\s/g, "").length },
    paragraphs: { total: paragraphs.length },
    spaces: { total: (text.match(/\s/g) ?? []).length }
  };
}
