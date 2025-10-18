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

import { addStyleAttribute } from "./utils.js";
import { Attribute } from "@tiptap/core";
import { mergeAttributes, Node } from "@tiptap/core";

export interface TableCellOptions {
  /**
   * The HTML attributes for a table cell node.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;
}

/**
 * This extension allows you to create table cells.
 * @see https://www.tiptap.dev/api/nodes/table-cell
 */
export const TableCell = Node.create<TableCellOptions>({
  name: "tableCell",

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  content: "block+",

  addAttributes() {
    return addTableCellAttributes();
  },

  tableRole: "cell",

  isolating: true,

  parseHTML() {
    return [{ tag: "td" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "td",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ];
  }
});

export function addTableCellAttributes(): Record<string, Attribute> {
  return {
    colwidth: {
      default: null,
      parseHTML(element) {
        const widthAttr =
          element.getAttribute("data-colwidth") ||
          element.getAttribute("colwidth");
        const widths =
          widthAttr && /^\d+(,\d+)*$/.test(widthAttr)
            ? widthAttr.split(",").map((s) => Number(s))
            : null;
        const colspan = Number(element.getAttribute("colspan") || 1);

        // migrate to data-colwidth attribute
        if (element.hasAttribute("colwidth")) {
          element.setAttribute(
            "data-colwidth",
            element.getAttribute("colwidth")!
          );
          element.removeAttribute("colwidth");
        }

        return widths && widths.length == colspan ? widths : null;
      },
      renderHTML(attributes) {
        if (!attributes.colwidth) {
          return {};
        }
        return {
          "data-colwidth": attributes.colwidth.join(",")
        };
      }
    },
    colspan: {
      default: 1,
      parseHTML(element) {
        return Number(element.getAttribute("colspan") || 1);
      },
      renderHTML(attributes) {
        return {
          colspan: attributes.colspan || 1
        };
      }
    },
    rowspan: {
      default: 1,
      parseHTML(element) {
        return Number(element.getAttribute("rowspan") || 1);
      },
      renderHTML(attributes) {
        return {
          rowspan: attributes.rowspan || 1
        };
      }
    },
    backgroundColor: addStyleAttribute("backgroundColor", "background-color"),
    color: addStyleAttribute("color", "color"),
    borderWidth: addStyleAttribute("borderWidth", "border-width", "px"),
    borderStyle: addStyleAttribute("borderStyle", "border-style"),
    borderColor: addStyleAttribute("borderColor", "border-color")
  };
}
