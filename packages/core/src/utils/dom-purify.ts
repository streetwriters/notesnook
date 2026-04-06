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

import DOMPurify, { WindowLike } from "dompurify";

const parseHTML = (input: string) =>
  "DOMParser" in globalThis
    ? new globalThis.DOMParser().parseFromString(input, "text/html")
    : null;

function ensureNodeFilter(win: any) {
  if (win.NodeFilter) return;

  function NodeFilter() {}

  NodeFilter.FILTER_ACCEPT = 1;
  NodeFilter.FILTER_REJECT = 2;
  NodeFilter.FILTER_SKIP = 3;

  NodeFilter.SHOW_ALL = 0xff_ff_ff_ff;
  NodeFilter.SHOW_ELEMENT = 0x1;
  NodeFilter.SHOW_ATTRIBUTE = 0x2;
  NodeFilter.SHOW_TEXT = 0x4;
  NodeFilter.SHOW_CDATA_SECTION = 0x8;
  NodeFilter.SHOW_ENTITY_REFERENCE = 0x10;
  NodeFilter.SHOW_ENTITY = 0x20;
  NodeFilter.SHOW_PROCESSING_INSTRUCTION = 0x40;
  NodeFilter.SHOW_COMMENT = 0x80;
  NodeFilter.SHOW_DOCUMENT = 0x1_00;
  NodeFilter.SHOW_DOCUMENT_TYPE = 0x2_00;
  NodeFilter.SHOW_DOCUMENT_FRAGMENT = 0x4_00;
  NodeFilter.SHOW_NOTATION = 0x8_00;

  win.NodeFilter = NodeFilter;
}

function createPurifyWindow() {
  const document = parseHTML(
    "<!doctype html><html><head><title>dompurify</title></head><body></body></html>"
  );
  const win = document?.defaultView as any;
  const doc = win.document;

  // DOMPurify calls new DOMParser().parseFromString(...)
  if (!win.DOMParser) {
    win.DOMParser = DOMParser;
  }

  ensureNodeFilter(win);

  // DOMPurify checks existence AND later relies on callable behavior.
  if (!doc.implementation) {
    doc.implementation = {};
  }

  if (typeof doc.implementation.createHTMLDocument !== "function") {
    doc.implementation.createHTMLDocument = (title = "") => {
      const document = parseHTML(
        "<!doctype html><html><head><title>dompurify</title></head><body></body></html>"
      );
      return document;
    };
  }

  if (typeof doc.implementation.createDocument !== "function") {
    doc.implementation.createDocument = () => {
      // Keep this as HTML doc because DOMPurify asks for body/html via getElementsByTagName.
      return parseHTML(
        "<!doctype html><html><head></head><body></body></html>"
      );
    };
  }

  return win as WindowLike;
}

let domPurify: DOMPurify.DOMPurify | undefined = undefined;
function getDomPurify() {
  if (DOMPurify.isSupported) return DOMPurify;
  if (!domPurify) {
    domPurify = DOMPurify(createPurifyWindow());
  }
  return domPurify;
}

export { getDomPurify };
