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

import { DOMParser, Node as ProsemirrorNode, Schema } from "@tiptap/pm/model";
import { toPages } from "./split.js";

export type PagingParserOptions = {
  pageSize: number;
  thresholdBlocks: number;
};

/**
 * Pages the document as it is parsed, so the very first view already renders
 * pages. Splitting after the editor exists would mean rendering the whole
 * document flat once and then again as pages.
 *
 * Only whole documents are paged. `parseSlice` — used for pasting, dropping and
 * `insertContent` — is left alone so inserted content joins the page it lands
 * in rather than becoming a page of its own.
 */
class PagingDOMParser extends DOMParser {
  options: PagingParserOptions = { pageSize: 0, thresholdBlocks: 0 };

  parse(dom: Node, options?: Parameters<DOMParser["parse"]>[1]) {
    const doc = super.parse(dom, options) as ProsemirrorNode;
    if (doc.childCount <= this.options.thresholdBlocks) return doc;
    return doc.type.create(
      doc.attrs,
      toPages(doc, this.schema, this.options.pageSize),
      doc.marks
    );
  }
}

export function installPagingParser(
  schema: Schema,
  options: PagingParserOptions
): void {
  const cached = schema.cached as { domParser?: DOMParser };
  if (!(cached.domParser instanceof PagingDOMParser)) {
    const base = DOMParser.fromSchema(schema);
    cached.domParser = new PagingDOMParser(schema, base.rules);
  }
  (cached.domParser as PagingDOMParser).options = options;
}
