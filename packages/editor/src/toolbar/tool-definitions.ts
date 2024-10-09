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

import { ToolbarDefinition, ToolDefinition } from "./types.js";
import { ToolId } from "./tools/index.js";
import { strings } from "@notesnook/intl";

const tools: Record<ToolId, ToolDefinition> = {
  none: {
    icon: "none",
    title: ""
  },
  bold: {
    icon: "bold",
    title: strings.bold()
  },
  italic: {
    icon: "italic",
    title: strings.italic()
  },
  underline: {
    icon: "underline",
    title: strings.underline()
  },
  strikethrough: {
    icon: "strikethrough",
    title: strings.strikethrough()
  },
  addInternalLink: {
    icon: "noteLink",
    title: strings.noteLink()
  },
  addLink: {
    icon: "link",
    title: strings.link()
  },
  editLink: {
    icon: "linkEdit",
    title: strings.linkEdit(),
    conditional: true
  },
  removeLink: {
    icon: "linkRemove",
    title: strings.linkRemove(),
    conditional: true
  },
  openLink: {
    icon: "openLink",
    title: strings.openLink(),
    conditional: true
  },
  copyLink: {
    icon: "copyLink",
    title: strings.copyLink(),
    conditional: true
  },
  linkSettings: {
    icon: "linkSettings",
    title: strings.linkSettings(),
    conditional: true
  },
  code: {
    icon: "code",
    title: strings.code()
  },
  codeRemove: {
    icon: "codeRemove",
    title: strings.codeRemove(),
    conditional: true
  },
  clearformatting: {
    icon: "formatClear",
    title: strings.formatClear()
  },
  subscript: {
    icon: "subscript",
    title: strings.subscript()
  },
  superscript: {
    icon: "superscript",
    title: strings.superscript()
  },
  insertBlock: {
    icon: "plus",
    title: strings.insert(),
    conditional: true
  },
  bulletList: {
    icon: "bulletList",
    title: strings.bulletList()
  },
  numberedList: {
    icon: "numberedList",
    title: strings.numberedList()
  },
  checkList: {
    icon: "checklist",
    title: strings.checklist()
  },
  fontFamily: {
    icon: "fontFamily",
    title: strings.fontFamily()
  },
  fontSize: {
    icon: "fontSize",
    title: strings.fontSize()
  },
  headings: {
    icon: "heading",
    title: strings.headings()
  },
  alignment: {
    icon: "alignCenter",
    title: strings.alignCenter()
  },
  textDirection: {
    icon: "ltr",
    title: strings.ltr()
  },
  highlight: {
    icon: "highlight",
    title: strings.highlight()
  },
  textColor: {
    icon: "textColor",
    title: strings.textColor()
  },
  math: {
    icon: "math",
    title: strings.mathInline()
  },

  tableSettings: {
    icon: "tableSettings",
    title: strings.tableSettings(),
    conditional: true
  },
  columnProperties: {
    icon: "columnProperties",
    title: strings.columnProperties(),
    conditional: true
  },
  rowProperties: {
    icon: "rowProperties",
    title: strings.rowProperties(),
    conditional: true
  },
  cellProperties: {
    icon: "cellProperties",
    title: strings.cellProperties(),
    conditional: true
  },
  insertColumnLeft: {
    icon: "insertColumnLeft",
    title: strings.insertColumnLeft(),
    conditional: true
  },
  insertColumnRight: {
    icon: "insertColumnRight",
    title: strings.insertColumnRight(),
    conditional: true
  },
  moveColumnLeft: {
    icon: "moveColumnLeft",
    title: strings.moveColumnLeft(),
    conditional: true
  },
  moveColumnRight: {
    icon: "moveColumnRight",
    title: strings.moveColumnRight(),
    conditional: true
  },
  deleteColumn: {
    icon: "deleteColumn",
    title: strings.deleteColumn(),
    conditional: true
  },
  splitCells: {
    icon: "splitCells",
    title: strings.splitCells(),
    conditional: true
  },
  mergeCells: {
    icon: "mergeCells",
    title: strings.mergeCells(),
    conditional: true
  },
  insertRowAbove: {
    icon: "insertRowAbove",
    title: strings.insertRowAbove(),
    conditional: true
  },
  insertRowBelow: {
    icon: "insertRowBelow",
    title: strings.insertRowBelow(),
    conditional: true
  },
  moveRowUp: {
    icon: "moveRowUp",
    title: strings.moveRowUp(),
    conditional: true
  },
  moveRowDown: {
    icon: "moveRowDown",
    title: strings.moveRowDown(),
    conditional: true
  },
  deleteRow: {
    icon: "deleteRow",
    title: strings.deleteRow(),
    conditional: true
  },
  deleteTable: {
    icon: "deleteTable",
    title: strings.deleteTable(),
    conditional: true
  },
  cellBackgroundColor: {
    icon: "backgroundColor",
    title: strings.cellBackgroundColor(),
    conditional: true
  },
  cellBorderColor: {
    icon: "cellBorderColor",
    title: strings.cellBorderColor(),
    conditional: true
  },
  cellTextColor: {
    icon: "textColor",
    title: strings.textColor(),
    conditional: true
  },
  cellBorderWidth: {
    icon: "none",
    title: strings.none(),
    conditional: true
  },
  imageSettings: {
    icon: "imageSettings",
    title: strings.imageSettings(),
    conditional: true
  },
  imageAlignCenter: {
    icon: "alignCenter",
    title: strings.alignCenter(),
    conditional: true
  },
  imageAlignLeft: {
    icon: "alignLeft",
    title: strings.alignLeft(),
    conditional: true
  },
  imageAlignRight: {
    icon: "alignRight",
    title: strings.alignRight(),
    conditional: true
  },
  imageFloat: {
    icon: "imageFloat",
    title: strings.imageFloat(),
    conditional: true
  },
  imageProperties: {
    icon: "more",
    title: strings.imageProperties(),
    conditional: true
  },
  previewAttachment: {
    icon: "previewAttachment",
    title: strings.previewAttachment(),
    conditional: true
  },
  attachmentSettings: {
    icon: "attachmentSettings",
    title: strings.attachmentSettings(),
    conditional: true
  },
  downloadAttachment: {
    icon: "download",
    title: strings.downloadAttachment(),
    conditional: true
  },
  removeAttachment: {
    icon: "delete",
    title: strings.delete(),
    conditional: true
  },
  embedSettings: {
    icon: "embedSettings",
    title: strings.embedSettings(),
    conditional: true
  },
  embedAlignCenter: {
    icon: "alignCenter",
    title: strings.alignCenter(),
    conditional: true
  },
  embedAlignLeft: {
    icon: "alignLeft",
    title: strings.alignLeft(),
    conditional: true
  },
  embedAlignRight: {
    icon: "alignRight",
    title: strings.alignRight(),
    conditional: true
  },
  embedProperties: {
    icon: "more",
    title: strings.embedProperties(),
    conditional: true
  },
  webclipSettings: {
    icon: "webclipSettings",
    title: strings.webclipSettings(),
    conditional: true
  },
  webclipFullScreen: {
    icon: "fullscreen",
    title: strings.fullscreen(),
    conditional: true
  },
  webclipOpenExternal: {
    icon: "openLink",
    title: strings.openLink(),
    conditional: true
  },
  webclipOpenSource: {
    icon: "openSource",
    title: strings.openSource(),
    conditional: true
  },
  outdent: {
    icon: "outdent",
    title: strings.outdent(),
    conditional: true
  },
  indent: {
    icon: "indent",
    title: strings.indent(),
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
    "attachmentSettings",
    "linkSettings",
    "codeRemove",
    "outdent",
    "indent",
    "webclipSettings"
  ]
];
export const MOBILE_STATIC_TOOLBAR_GROUPS: ToolbarDefinition = [
  [...STATIC_TOOLBAR_GROUPS[0], "previewAttachment"]
];

export const READONLY_MOBILE_STATIC_TOOLBAR_GROUPS: ToolbarDefinition = [
  [
    "imageSettings",
    "attachmentSettings",
    "linkSettings",
    "webclipSettings",
    "previewAttachment"
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
    ["checkList", "numberedList", "bulletList"],
    ["addLink", "addInternalLink"],
    ["alignment", "textDirection"],
    ["clearformatting"]
  ],
  minimal: [
    ["bold", "italic", "underline", "strikethrough", "code"],
    ["headings", "addLink"],
    ["clearformatting"]
  ]
};
