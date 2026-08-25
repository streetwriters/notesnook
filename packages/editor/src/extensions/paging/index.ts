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
import { installFlatteningSerializer } from "./serializer.js";
import { installPagingParser } from "./parser.js";
import { DEFAULT_PAGE_SIZE, countPages, toPages } from "./split.js";

export type PagingOptions = {
  enabled: boolean;
  pageSize: number;
  thresholdBlocks: number;
};

export const Paging = Extension.create<PagingOptions>({
  name: "paging",

  addOptions() {
    return {
      enabled: false,
      pageSize: DEFAULT_PAGE_SIZE,
      thresholdBlocks: 300
    };
  },

  // Runs before the first view exists, so the document arrives already paged
  // and is never rendered flat.
  onBeforeCreate() {
    installFlatteningSerializer(this.editor.schema);
    if (!this.options.enabled) return;
    installPagingParser(this.editor.schema, {
      pageSize: this.options.pageSize,
      thresholdBlocks: this.options.thresholdBlocks
    });
  },

  // Content that arrives as JSON bypasses the parser, so this stays as a
  // fallback for documents the parser never saw.
  onCreate() {
    if (!this.options.enabled) return;
    const { editor } = this;
    const doc = editor.state.doc;
    if (doc.childCount <= this.options.thresholdBlocks) return;
    if (countPages(doc) > 0) return;

    const end = profiler.start("paging.split");
    const pages = toPages(doc, editor.schema, this.options.pageSize);
    editor.view.dispatch(
      editor.state.tr
        .replaceWith(0, doc.content.size, pages)
        .setMeta("preventUpdate", true)
        .setMeta("addToHistory", false)
        .setMeta("ignoreEdit", true)
    );
    end();
    profiler.count("paging.splits");
    profiler.gauge("paging.pages", countPages(editor.state.doc));
  }
});

export { Page, PAGE_NODE } from "./page.js";
export {
  DEFAULT_PAGE_SIZE,
  countPages,
  flattenBlocks,
  flattenPages,
  isPage,
  toPages
} from "./split.js";
export { installFlatteningSerializer } from "./serializer.js";
export { installPagingParser, uninstallPagingParser } from "./parser.js";
export { fromFlatPosition, toFlatPosition } from "./positions.js";
export { serializeDocumentHTML } from "./serialize.js";
