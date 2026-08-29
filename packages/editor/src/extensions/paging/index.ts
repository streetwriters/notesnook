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

import { Extension } from "@tiptap/core";
import { profiler } from "../../utils/profiler.js";
import { HeightMap } from "./height-map.js";
import { installPagingParser } from "./parser.js";
import { installFlatteningSerializer } from "./serializer.js";
import { DEFAULT_PAGE_SIZE, countPages, toPages } from "./split.js";
import { viewportPlugin } from "./viewport-plugin.js";

/** Paging only engages for notes larger than this many top-level blocks. */
const DEFAULT_THRESHOLD_BLOCKS = 100;

export type PagingOptions = {
  enabled: boolean;
  pageSize: number;
  thresholdBlocks: number;
};

export type PagingStorage = {
  heights: HeightMap;
};

/**
 * Renders only the pages near the viewport, keeping the rest of the note in the
 * document as empty boxes of their estimated height. Pages are grouped as a
 * note is parsed and stripped again on serialization, so nothing about how a
 * note is stored changes.
 *
 * Browser find-in-page and printing only cover rendered pages, so this is
 * opt-in and only engages past a size threshold.
 */
export const Paging = Extension.create<PagingOptions>({
  name: "paging",

  addOptions() {
    return {
      enabled: false,
      pageSize: DEFAULT_PAGE_SIZE,
      thresholdBlocks: DEFAULT_THRESHOLD_BLOCKS
    };
  },

  addStorage(): PagingStorage {
    return { heights: new HeightMap() };
  },

  onBeforeCreate() {
    installFlatteningSerializer(this.editor.schema);
    if (!this.options.enabled) return;
    installPagingParser(this.editor.schema, {
      pageSize: this.options.pageSize,
      thresholdBlocks: this.options.thresholdBlocks
    });
  },

  onCreate() {
    if (!this.options.enabled) return;
    const { editor } = this;
    const doc = editor.state.doc;
    if (doc.childCount <= this.options.thresholdBlocks) return;
    if (countPages(doc) > 0) return;

    editor.view.dispatch(
      editor.state.tr
        .replaceWith(
          0,
          doc.content.size,
          toPages(doc, editor.schema, this.options.pageSize)
        )
        .setMeta("preventUpdate", true)
        .setMeta("addToHistory", false)
        .setMeta("ignoreEdit", true)
    );
    profiler.gauge("paging.pages", countPages(editor.state.doc));
  },

  addProseMirrorPlugins() {
    if (!this.options.enabled) return [];
    return [viewportPlugin(this.storage.heights)];
  }
});

export { PAGE_NODE, Page } from "./page.js";
export {
  getScrollAnchor,
  restoreScrollAnchor,
  type ScrollAnchor
} from "./anchor.js";
export { fromFlatPosition, toFlatPosition } from "./positions.js";
export { serializeDocumentHTML } from "./serialize.js";
export {
  DEFAULT_PAGE_SIZE,
  countPages,
  flattenBlocks,
  flattenPages,
  isPage,
  toPages
} from "./split.js";
export { viewportKey } from "./state.js";
