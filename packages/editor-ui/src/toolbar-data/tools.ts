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

import type { IconNames } from "./icons.js";

/**
 * Every tool the toolbar knows about. Plain strings: the React component that
 * implements a tool lives elsewhere and is looked up by these ids.
 */
export const TOOL_IDS = [
  "none",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "addInternalLink",
  "addLink",
  "editLink",
  "removeLink",
  "openLink",
  "copyLink",
  "linkSettings",
  "code",
  "codeRemove",
  "clearformatting",
  "subscript",
  "superscript",
  "insertBlock",
  "bulletList",
  "numberedList",
  "checkList",
  "fontFamily",
  "fontSize",
  "headings",
  "alignment",
  "textDirection",
  "highlight",
  "textColor",
  "math",
  "tableSettings",
  "columnProperties",
  "rowProperties",
  "cellProperties",
  "insertColumnLeft",
  "insertColumnRight",
  "moveColumnLeft",
  "moveColumnRight",
  "deleteColumn",
  "splitCells",
  "mergeCells",
  "insertRowAbove",
  "insertRowBelow",
  "moveRowUp",
  "moveRowDown",
  "deleteRow",
  "deleteTable",
  "cellBackgroundColor",
  "cellBorderColor",
  "cellTextColor",
  "cellBorderWidth",
  "imageSettings",
  "imageAlignCenter",
  "imageAlignLeft",
  "imageAlignRight",
  "imageProperties",
  "previewAttachment",
  "attachmentSettings",
  "downloadAttachment",
  "removeAttachment",
  "embedSettings",
  "embedAlignCenter",
  "embedAlignLeft",
  "embedAlignRight",
  "embedProperties",
  "webclipSettings",
  "webclipFullScreen",
  "webclipOpenExternal",
  "webclipOpenSource",
  "outdent",
  "indent",
  "exportToCSV"
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

/**
 * A tool as plain data. `icon` is a key of `ICONS`; `titleKey` is the name of
 * the `@notesnook/intl` string that holds the (localized) title, or "" for no
 * title. Nothing here is a function or a component, so it survives
 * `JSON.stringify`.
 */
export type ToolData = {
  icon: IconNames;
  titleKey: string;
  conditional?: boolean;
  description?: string;
};

export const TOOLS: Record<ToolId, ToolData> = {
  none: {
    icon: "none",
    titleKey: ""
  },
  bold: {
    icon: "bold",
    titleKey: "bold"
  },
  italic: {
    icon: "italic",
    titleKey: "italic"
  },
  underline: {
    icon: "underline",
    titleKey: "underline"
  },
  strikethrough: {
    icon: "strikethrough",
    titleKey: "strikethrough"
  },
  addInternalLink: {
    icon: "noteLink",
    titleKey: "noteLink"
  },
  addLink: {
    icon: "link",
    titleKey: "link"
  },
  editLink: {
    icon: "linkEdit",
    titleKey: "linkEdit",
    conditional: true
  },
  removeLink: {
    icon: "linkRemove",
    titleKey: "linkRemove",
    conditional: true
  },
  openLink: {
    icon: "openLink",
    titleKey: "openLink",
    conditional: true
  },
  copyLink: {
    icon: "copyLink",
    titleKey: "copyLink",
    conditional: true
  },
  linkSettings: {
    icon: "linkSettings",
    titleKey: "linkSettings",
    conditional: true
  },
  code: {
    icon: "code",
    titleKey: "code"
  },
  codeRemove: {
    icon: "codeRemove",
    titleKey: "codeRemove",
    conditional: true
  },
  clearformatting: {
    icon: "formatClear",
    titleKey: "formatClear"
  },
  subscript: {
    icon: "subscript",
    titleKey: "subscript"
  },
  superscript: {
    icon: "superscript",
    titleKey: "superscript"
  },
  insertBlock: {
    icon: "plus",
    titleKey: "insert",
    conditional: true
  },
  bulletList: {
    icon: "bulletList",
    titleKey: "bulletList"
  },
  numberedList: {
    icon: "numberedList",
    titleKey: "numberedList"
  },
  checkList: {
    icon: "checklist",
    titleKey: "checklist"
  },
  fontFamily: {
    icon: "fontFamily",
    titleKey: "fontFamily"
  },
  fontSize: {
    icon: "fontSize",
    titleKey: "fontSize"
  },
  headings: {
    icon: "heading",
    titleKey: "headings"
  },
  alignment: {
    icon: "alignCenter",
    titleKey: "alignment"
  },
  textDirection: {
    icon: "ltr",
    titleKey: "ltr"
  },
  highlight: {
    icon: "highlight",
    titleKey: "highlight"
  },
  textColor: {
    icon: "textColor",
    titleKey: "textColor"
  },
  math: {
    icon: "math",
    titleKey: "mathInline"
  },

  tableSettings: {
    icon: "tableSettings",
    titleKey: "tableSettings",
    conditional: true
  },
  columnProperties: {
    icon: "columnProperties",
    titleKey: "columnProperties",
    conditional: true
  },
  rowProperties: {
    icon: "rowProperties",
    titleKey: "rowProperties",
    conditional: true
  },
  cellProperties: {
    icon: "cellProperties",
    titleKey: "cellProperties",
    conditional: true
  },
  insertColumnLeft: {
    icon: "insertColumnLeft",
    titleKey: "insertColumnLeft",
    conditional: true
  },
  insertColumnRight: {
    icon: "insertColumnRight",
    titleKey: "insertColumnRight",
    conditional: true
  },
  moveColumnLeft: {
    icon: "moveColumnLeft",
    titleKey: "moveColumnLeft",
    conditional: true
  },
  moveColumnRight: {
    icon: "moveColumnRight",
    titleKey: "moveColumnRight",
    conditional: true
  },
  deleteColumn: {
    icon: "deleteColumn",
    titleKey: "deleteColumn",
    conditional: true
  },
  splitCells: {
    icon: "splitCells",
    titleKey: "splitCells",
    conditional: true
  },
  mergeCells: {
    icon: "mergeCells",
    titleKey: "mergeCells",
    conditional: true
  },
  insertRowAbove: {
    icon: "insertRowAbove",
    titleKey: "insertRowAbove",
    conditional: true
  },
  insertRowBelow: {
    icon: "insertRowBelow",
    titleKey: "insertRowBelow",
    conditional: true
  },
  moveRowUp: {
    icon: "moveRowUp",
    titleKey: "moveRowUp",
    conditional: true
  },
  moveRowDown: {
    icon: "moveRowDown",
    titleKey: "moveRowDown",
    conditional: true
  },
  deleteRow: {
    icon: "deleteRow",
    titleKey: "deleteRow",
    conditional: true
  },
  deleteTable: {
    icon: "deleteTable",
    titleKey: "deleteTable",
    conditional: true
  },
  cellBackgroundColor: {
    icon: "backgroundColor",
    titleKey: "cellBackgroundColor",
    conditional: true
  },
  cellBorderColor: {
    icon: "cellBorderColor",
    titleKey: "cellBorderColor",
    conditional: true
  },
  cellTextColor: {
    icon: "textColor",
    titleKey: "textColor",
    conditional: true
  },
  cellBorderWidth: {
    icon: "none",
    titleKey: "none",
    conditional: true
  },
  imageSettings: {
    icon: "imageSettings",
    titleKey: "imageSettings",
    conditional: true
  },
  imageAlignCenter: {
    icon: "alignCenter",
    titleKey: "alignCenter",
    conditional: true
  },
  imageAlignLeft: {
    icon: "alignLeft",
    titleKey: "alignLeft",
    conditional: true
  },
  imageAlignRight: {
    icon: "alignRight",
    titleKey: "alignRight",
    conditional: true
  },
  imageProperties: {
    icon: "more",
    titleKey: "imageProperties",
    conditional: true
  },
  previewAttachment: {
    icon: "previewAttachment",
    titleKey: "previewAttachment",
    conditional: true
  },
  attachmentSettings: {
    icon: "attachmentSettings",
    titleKey: "attachmentSettings",
    conditional: true
  },
  downloadAttachment: {
    icon: "download",
    titleKey: "downloadAttachment",
    conditional: true
  },
  removeAttachment: {
    icon: "delete",
    titleKey: "delete",
    conditional: true
  },
  embedSettings: {
    icon: "embedSettings",
    titleKey: "embedSettings",
    conditional: true
  },
  embedAlignCenter: {
    icon: "alignCenter",
    titleKey: "alignCenter",
    conditional: true
  },
  embedAlignLeft: {
    icon: "alignLeft",
    titleKey: "alignLeft",
    conditional: true
  },
  embedAlignRight: {
    icon: "alignRight",
    titleKey: "alignRight",
    conditional: true
  },
  embedProperties: {
    icon: "more",
    titleKey: "embedProperties",
    conditional: true
  },
  webclipSettings: {
    icon: "webclipSettings",
    titleKey: "webclipSettings",
    conditional: true
  },
  webclipFullScreen: {
    icon: "fullscreen",
    titleKey: "fullscreen",
    conditional: true
  },
  webclipOpenExternal: {
    icon: "openLink",
    titleKey: "openLink",
    conditional: true
  },
  webclipOpenSource: {
    icon: "openSource",
    titleKey: "openSource",
    conditional: true
  },
  outdent: {
    icon: "outdent",
    titleKey: "outdent",
    conditional: true
  },
  indent: {
    icon: "indent",
    titleKey: "indent",
    conditional: true
  },
  exportToCSV: {
    icon: "csv",
    titleKey: "exportCsv",
    conditional: true
  }
};
