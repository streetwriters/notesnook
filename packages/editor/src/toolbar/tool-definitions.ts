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

import { ToolbarDefinition, ToolDefinition } from "./types";
import { ToolId } from "./tools";

const tools: Record<ToolId, ToolDefinition> = {
  none: {
    icon: "none",
    title: ""
  },
  bold: {
    icon: "bold",
    title: "Bold"
  },
  italic: {
    icon: "italic",
    title: "Italic"
  },
  underline: {
    icon: "underline",
    title: "Underline"
  },
  strikethrough: {
    icon: "strikethrough",
    title: "Strikethrough"
  },
  addLink: {
    icon: "link",
    title: "Link"
  },
  editLink: {
    icon: "linkEdit",
    title: "Edit link",
    conditional: true
  },
  removeLink: {
    icon: "linkRemove",
    title: "Remove link",
    conditional: true
  },
  openLink: {
    icon: "openLink",
    title: "Open link",
    conditional: true
  },
  linkSettings: {
    icon: "linkSettings",
    title: "Link settings",
    conditional: true
  },
  code: {
    icon: "code",
    title: "Code"
  },
  codeRemove: {
    icon: "codeRemove",
    title: "Code",
    conditional: true
  },
  clearformatting: {
    icon: "formatClear",
    title: "Clear all formatting"
  },
  subscript: {
    icon: "subscript",
    title: "Subscript"
  },
  superscript: {
    icon: "superscript",
    title: "Superscript"
  },
  insertBlock: {
    icon: "plus",
    title: "Insert",
    conditional: true
  },
  bulletList: {
    icon: "bulletList",
    title: "Bullet list"
  },
  numberedList: {
    icon: "numberedList",
    title: "Numbered list"
  },
  fontFamily: {
    icon: "fontFamily",
    title: "Font family"
  },
  fontSize: {
    icon: "fontSize",
    title: "Font size"
  },
  headings: {
    icon: "heading",
    title: "Headings"
  },
  alignment: {
    icon: "alignCenter",
    title: "Alignment"
  },
  textDirection: {
    icon: "ltr",
    title: "Text direction"
  },
  highlight: {
    icon: "highlight",
    title: "Highlight"
  },
  textColor: {
    icon: "textColor",
    title: "Text color"
  },
  math: {
    icon: "math",
    title: "Math (inline)"
  },

  tableSettings: {
    icon: "tableSettings",
    title: "Table settings",
    conditional: true
  },
  columnProperties: {
    icon: "columnProperties",
    title: "Column properties",
    conditional: true
  },
  rowProperties: {
    icon: "rowProperties",
    title: "Row properties",
    conditional: true
  },
  cellProperties: {
    icon: "cellProperties",
    title: "Cell properties",
    conditional: true
  },
  insertColumnLeft: {
    icon: "insertColumnLeft",
    title: "Insert column left",
    conditional: true
  },
  insertColumnRight: {
    icon: "insertColumnRight",
    title: "Insert column right",
    conditional: true
  },
  moveColumnLeft: {
    icon: "moveColumnLeft",
    title: "Move column left",
    conditional: true
  },
  moveColumnRight: {
    icon: "moveColumnRight",
    title: "Move column right",
    conditional: true
  },
  deleteColumn: {
    icon: "deleteColumn",
    title: "Delete column",
    conditional: true
  },
  splitCells: {
    icon: "splitCells",
    title: "Split cells",
    conditional: true
  },
  mergeCells: {
    icon: "mergeCells",
    title: "Merge cells",
    conditional: true
  },
  insertRowAbove: {
    icon: "insertRowAbove",
    title: "Insert row above",
    conditional: true
  },
  insertRowBelow: {
    icon: "insertRowBelow",
    title: "Insert row below",
    conditional: true
  },
  moveRowUp: {
    icon: "moveRowUp",
    title: "Move row up",
    conditional: true
  },
  moveRowDown: {
    icon: "moveRowDown",
    title: "Move row down",
    conditional: true
  },
  deleteRow: {
    icon: "deleteRow",
    title: "Delete row",
    conditional: true
  },
  deleteTable: {
    icon: "deleteTable",
    title: "Delete table",
    conditional: true
  },
  exportToCSV: {
    icon: "csv",
    title: "Export to CSV",
    conditional: true
  },
  cellBackgroundColor: {
    icon: "backgroundColor",
    title: "Cell background color",
    conditional: true
  },
  cellBorderColor: {
    icon: "cellBorderColor",
    title: "Cell border color",
    conditional: true
  },
  cellTextColor: {
    icon: "textColor",
    title: "Cell text color",
    conditional: true
  },
  cellBorderWidth: {
    icon: "none",
    title: "Cell border width",
    conditional: true
  },
  imageSettings: {
    icon: "imageSettings",
    title: "Image settings",
    conditional: true
  },
  imageAlignCenter: {
    icon: "alignCenter",
    title: "Align center",
    conditional: true
  },
  imageAlignLeft: {
    icon: "alignLeft",
    title: "Align left",
    conditional: true
  },
  imageAlignRight: {
    icon: "alignRight",
    title: "Align right",
    conditional: true
  },
  imageProperties: {
    icon: "more",
    title: "Image properties",
    conditional: true
  },
  previewAttachment: {
    icon: "previewAttachment",
    title: "Preview attachment",
    conditional: true
  },
  attachmentSettings: {
    icon: "attachmentSettings",
    title: "Attachment settings",
    conditional: true
  },
  downloadAttachment: {
    icon: "download",
    title: "Download attachment",
    conditional: true
  },
  removeAttachment: {
    icon: "delete",
    title: "Remove attachment",
    conditional: true
  },
  embedSettings: {
    icon: "embedSettings",
    title: "Embed settings",
    conditional: true
  },
  embedAlignCenter: {
    icon: "alignCenter",
    title: "Align center",
    conditional: true
  },
  embedAlignLeft: {
    icon: "alignLeft",
    title: "Align left",
    conditional: true
  },
  embedAlignRight: {
    icon: "alignRight",
    title: "Align right",
    conditional: true
  },
  embedProperties: {
    icon: "more",
    title: "Embed properties",
    conditional: true
  },
  webclipSettings: {
    icon: "webclipSettings",
    title: "Web clip settings",
    conditional: true
  },
  webclipFullScreen: {
    icon: "fullscreen",
    title: "Full screen",
    conditional: true
  },
  webclipOpenExternal: {
    icon: "openLink",
    title: "Open in new tab",
    conditional: true
  },
  webclipOpenSource: {
    icon: "openSource",
    title: "Open source",
    conditional: true
  },
  outdent: {
    icon: "outdent",
    title: "Lift list item",
    conditional: true
  },
  indent: {
    icon: "indent",
    title: "Sink list item",
    conditional: true
  }
};

export function getToolDefinition(id: ToolId) {
  return tools[id];
}

export function getAllTools() {
  return tools;
}

export function getDefaultPresets() {
  return defaultPresets;
}

export const STATIC_TOOLBAR_GROUPS: ToolbarDefinition = [
  [
    "insertBlock",
    "tableSettings",
    "cellProperties",
    "imageSettings",
    "embedSettings",
    "previewAttachment",
    "attachmentSettings",
    "linkSettings",
    "codeRemove",
    "outdent",
    "indent",
    "webclipSettings"
  ]
];

const defaultPresets: Record<"default" | "minimal", ToolbarDefinition> = {
  default: [
    [
      "bold",
      "italic",
      "underline",
      [
        "strikethrough",
        "code",
        "subscript",
        "superscript",
        "highlight",
        "textColor",
        "math"
      ]
    ],
    ["fontSize"],
    ["headings", "fontFamily"],
    ["numberedList", "bulletList"],
    ["addLink"],
    ["alignment", "textDirection"],
    ["clearformatting"]
  ],
  minimal: [
    ["bold", "italic", "underline", "strikethrough", "code"],
    ["headings", "addLink"],
    ["clearformatting"]
  ]
};
