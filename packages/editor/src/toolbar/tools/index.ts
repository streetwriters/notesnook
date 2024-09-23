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

import React from "react";
import { ToolProps } from "../types.js";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  ClearFormatting,
  CodeRemove,
  Math
} from "./inline.js";
import { InsertBlock } from "./block.js";
import { FontSize, FontFamily } from "./font.js";
import { Alignment } from "./alignment.js";
import { Headings } from "./headings.js";
import { NumberedList, BulletList, Outdent, Indent, CheckList } from "./lists.js";
import { TextDirection } from "./text-direction.js";
import { Highlight, TextColor } from "./colors.js";
import {
  TableSettings,
  ColumnProperties,
  RowProperties,
  CellProperties,
  InsertColumnLeft,
  InsertColumnRight,
  MoveColumnLeft,
  MoveColumnRight,
  DeleteColumn,
  SplitCells,
  MergeCells,
  InsertRowAbove,
  InsertRowBelow,
  MoveRowUp,
  MoveRowDown,
  DeleteRow,
  DeleteTable,
  CellBackgroundColor,
  CellBorderColor,
  CellTextColor,
  CellBorderWidth
} from "./table.js";
import {
  ImageSettings,
  ImageAlignCenter,
  ImageAlignLeft,
  ImageAlignRight,
  ImageFloat,
  ImageProperties
} from "./image.js";
import {
  AttachmentSettings,
  DownloadAttachment,
  PreviewAttachment,
  RemoveAttachment
} from "./attachment.js";
import {
  EmbedAlignCenter,
  EmbedAlignLeft,
  EmbedAlignRight,
  EmbedProperties,
  EmbedSettings
} from "./embed.js";
import {
  AddLink,
  AddInternalLink,
  EditLink,
  RemoveLink,
  LinkSettings,
  OpenLink,
  CopyLink
} from "./link.js";
import {
  WebClipFullScreen,
  WebClipSettings,
  WebClipOpenExternal,
  WebClipOpenSource
} from "./web-clip.js";

export type ToolId = keyof typeof tools;
const tools = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  code: Code,
  codeRemove: CodeRemove,
  subscript: Subscript,
  superscript: Superscript,
  clearformatting: ClearFormatting,
  addInternalLink: AddInternalLink,
  addLink: AddLink,
  editLink: EditLink,
  removeLink: RemoveLink,
  copyLink: CopyLink,
  linkSettings: LinkSettings,
  openLink: OpenLink,
  insertBlock: InsertBlock,
  numberedList: NumberedList,
  bulletList: BulletList,
  checkList: CheckList,
  fontSize: FontSize,
  fontFamily: FontFamily,
  headings: Headings,
  alignment: Alignment,
  textDirection: TextDirection,
  textColor: TextColor,
  highlight: Highlight,
  math: Math,

  imageSettings: ImageSettings,
  imageAlignCenter: ImageAlignCenter,
  imageAlignLeft: ImageAlignLeft,
  imageAlignRight: ImageAlignRight,
  imageProperties: ImageProperties,
  imageFloat: ImageFloat,

  embedAlignCenter: EmbedAlignCenter,
  embedAlignLeft: EmbedAlignLeft,
  embedAlignRight: EmbedAlignRight,
  embedProperties: EmbedProperties,
  embedSettings: EmbedSettings,

  webclipFullScreen: WebClipFullScreen,
  webclipOpenExternal: WebClipOpenExternal,
  webclipOpenSource: WebClipOpenSource,
  webclipSettings: WebClipSettings,

  previewAttachment: PreviewAttachment,
  attachmentSettings: AttachmentSettings,
  downloadAttachment: DownloadAttachment,
  removeAttachment: RemoveAttachment,

  tableSettings: TableSettings,
  columnProperties: ColumnProperties,
  rowProperties: RowProperties,
  cellProperties: CellProperties,
  insertColumnLeft: InsertColumnLeft,
  insertColumnRight: InsertColumnRight,
  moveColumnLeft: MoveColumnLeft,
  moveColumnRight: MoveColumnRight,
  deleteColumn: DeleteColumn,
  splitCells: SplitCells,
  mergeCells: MergeCells,
  cellBackgroundColor: CellBackgroundColor,
  cellBorderColor: CellBorderColor,
  cellTextColor: CellTextColor,
  cellBorderWidth: CellBorderWidth,
  insertRowAbove: InsertRowAbove,
  insertRowBelow: InsertRowBelow,
  moveRowUp: MoveRowUp,
  moveRowDown: MoveRowDown,
  deleteRow: DeleteRow,
  deleteTable: DeleteTable,

  outdent: Outdent,
  indent: Indent,

  none: () => null
};

export function findTool(id: ToolId): React.FunctionComponent<ToolProps> {
  return tools[id];
}
