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

import { Fragment, Node as ProsemirrorNode, Schema } from "@tiptap/pm/model";
import { nanoid } from "nanoid";
import { PAGE_NODE } from "./page.js";

/** Blocks are grouped into pages of this size when a note is opened. */
export const DEFAULT_PAGE_SIZE = 50;

export function isPage(node: ProsemirrorNode): boolean {
  return node.type.name === PAGE_NODE;
}

/**
 * Groups the document's top-level blocks into pages. Existing pages are
 * dissolved first so the result only depends on the blocks, never on how the
 * document happened to be paged before.
 */
export function toPages(
  doc: ProsemirrorNode,
  schema: Schema,
  pageSize: number = DEFAULT_PAGE_SIZE
): Fragment {
  const pageType = schema.nodes[PAGE_NODE];
  if (!pageType || pageSize < 1) return doc.content;

  const blocks = flattenBlocks(doc);
  if (!blocks.length) return doc.content;

  const identify = "blockId" in (pageType.spec.attrs ?? {});
  const pages: ProsemirrorNode[] = [];
  for (let i = 0; i < blocks.length; i += pageSize)
    pages.push(
      pageType.create(
        identify ? { blockId: nanoid(8) } : null,
        blocks.slice(i, i + pageSize)
      )
    );

  return Fragment.fromArray(pages);
}

/** The same content with every page wrapper removed. */
export function flattenPages(fragment: Fragment): Fragment {
  let paged = false;
  fragment.forEach((node) => {
    if (isPage(node)) paged = true;
  });
  if (!paged) return fragment;

  const blocks: ProsemirrorNode[] = [];
  fragment.forEach((node) => {
    if (isPage(node)) node.content.forEach((child) => blocks.push(child));
    else blocks.push(node);
  });
  return Fragment.fromArray(blocks);
}

export function flattenBlocks(doc: ProsemirrorNode): ProsemirrorNode[] {
  const blocks: ProsemirrorNode[] = [];
  flattenPages(doc.content).forEach((node) => blocks.push(node));
  return blocks;
}

export function countPages(doc: ProsemirrorNode): number {
  let pages = 0;
  doc.forEach((node) => {
    if (isPage(node)) pages++;
  });
  return pages;
}
