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

import type { ToolOverrides } from "../../controller.js";
import { tiptapOnly } from "./tiptap-only.js";
import { InsertBlock } from "./block.js";
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
  CellBorderWidth,
  ExportToCSV
} from "./table.js";
import {
  ImageSettings,
  ImageAlignCenter,
  ImageAlignLeft,
  ImageAlignRight,
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

export const TIPTAP_TOOLS: ToolOverrides = {
  addInternalLink: tiptapOnly(AddInternalLink),
  addLink: tiptapOnly(AddLink),
  editLink: tiptapOnly(EditLink),
  removeLink: tiptapOnly(RemoveLink),
  copyLink: tiptapOnly(CopyLink),
  linkSettings: tiptapOnly(LinkSettings),
  openLink: tiptapOnly(OpenLink),
  insertBlock: tiptapOnly(InsertBlock),

  imageSettings: tiptapOnly(ImageSettings),
  imageAlignCenter: tiptapOnly(ImageAlignCenter),
  imageAlignLeft: tiptapOnly(ImageAlignLeft),
  imageAlignRight: tiptapOnly(ImageAlignRight),
  imageProperties: tiptapOnly(ImageProperties),

  embedAlignCenter: tiptapOnly(EmbedAlignCenter),
  embedAlignLeft: tiptapOnly(EmbedAlignLeft),
  embedAlignRight: tiptapOnly(EmbedAlignRight),
  embedProperties: tiptapOnly(EmbedProperties),
  embedSettings: tiptapOnly(EmbedSettings),

  webclipFullScreen: tiptapOnly(WebClipFullScreen),
  webclipOpenExternal: tiptapOnly(WebClipOpenExternal),
  webclipOpenSource: tiptapOnly(WebClipOpenSource),
  webclipSettings: tiptapOnly(WebClipSettings),

  previewAttachment: tiptapOnly(PreviewAttachment),
  attachmentSettings: tiptapOnly(AttachmentSettings),
  downloadAttachment: tiptapOnly(DownloadAttachment),
  removeAttachment: tiptapOnly(RemoveAttachment),

  tableSettings: tiptapOnly(TableSettings),
  columnProperties: tiptapOnly(ColumnProperties),
  rowProperties: tiptapOnly(RowProperties),
  cellProperties: tiptapOnly(CellProperties),
  insertColumnLeft: tiptapOnly(InsertColumnLeft),
  insertColumnRight: tiptapOnly(InsertColumnRight),
  moveColumnLeft: tiptapOnly(MoveColumnLeft),
  moveColumnRight: tiptapOnly(MoveColumnRight),
  deleteColumn: tiptapOnly(DeleteColumn),
  splitCells: tiptapOnly(SplitCells),
  mergeCells: tiptapOnly(MergeCells),
  cellBackgroundColor: tiptapOnly(CellBackgroundColor),
  cellBorderColor: tiptapOnly(CellBorderColor),
  cellTextColor: tiptapOnly(CellTextColor),
  cellBorderWidth: tiptapOnly(CellBorderWidth),
  insertRowAbove: tiptapOnly(InsertRowAbove),
  insertRowBelow: tiptapOnly(InsertRowBelow),
  moveRowUp: tiptapOnly(MoveRowUp),
  moveRowDown: tiptapOnly(MoveRowDown),
  deleteRow: tiptapOnly(DeleteRow),
  deleteTable: tiptapOnly(DeleteTable),
  exportToCSV: tiptapOnly(ExportToCSV)
};
