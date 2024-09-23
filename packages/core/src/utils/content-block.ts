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

import { ContentBlock } from "../types.js";
import { InternalLinkWithOffset, parseInternalLink } from "./internal-link.js";

const INTERNAL_LINK_REGEX = /(?:\[\[(nn:\/\/note\/.+?)\]\])/gm;
export function extractInternalLinks(block: ContentBlock) {
  const matches = block.content.matchAll(INTERNAL_LINK_REGEX);

  const links: InternalLinkWithOffset[] = [];
  for (const match of matches) {
    if (match.index === undefined) continue;
    const url = match[1].slice(0, match[1].lastIndexOf("|"));
    const text = match[1].slice(match[1].lastIndexOf("|") + 1);
    const link = parseInternalLink(url);
    if (!link) continue;
    links.push({
      ...link,
      start: match.index,
      end: match.index + match[0].length,
      text
    });
  }

  return links;
}

function normalize(block: ContentBlock, links: InternalLinkWithOffset[]) {
  let diff = 0;
  for (const link of links) {
    link.start -= diff;
    link.end -= diff;
    block.content =
      block.content.slice(0, link.start) +
      link.text +
      block.content.slice(link.end);
    diff += link.end - link.start - link.text.length;

    link.end = link.start + link.text.length;
  }
  return block;
}

export type TextSlice = { text: string; highlighted: boolean };
export function highlightInternalLinks(
  block: ContentBlock,
  noteId: string
): [TextSlice, TextSlice, TextSlice][] {
  const links = extractInternalLinks(block);
  normalize(block, links);
  const highlighted: [TextSlice, TextSlice, TextSlice][] = [];
  for (const link of links) {
    const start = block.content.slice(0, link.start);
    const end = block.content.slice(link.end);
    if (link.id !== noteId) continue;

    highlighted.push([
      {
        text: ellipsize(start, 50, "start"),
        highlighted: false
      },
      {
        highlighted: link.id === noteId,
        text: link.text
      },
      {
        highlighted: false,
        text: ellipsize(end, 50, "end")
      }
    ]);
  }
  return highlighted;
}

export function ellipsize(
  text: string,
  maxLength: number,
  from: "start" | "end"
) {
  const needsTruncation = text.length > maxLength;
  const offsets = needsTruncation
    ? from === "start"
      ? [-maxLength, undefined]
      : [0, maxLength]
    : [0, text.length];
  const truncated = text.slice(offsets[0], offsets[1]);
  return needsTruncation
    ? from === "start"
      ? "..." + truncated
      : truncated + "..."
    : truncated;
}
