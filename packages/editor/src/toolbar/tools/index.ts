import React from "react";
import { ToolProps } from "../types";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  ClearFormatting,
  Link,
} from "./inline";
import { InsertBlock } from "./block";
import { FontSize, FontFamily } from "./font";
import { AlignCenter, AlignLeft, AlignRight, AlignJustify } from "./alignment";
import { Headings } from "./headings";
import { NumberedList, BulletList } from "./lists";
import { LeftToRight, RightToLeft } from "./text-direction";
import { Highlight, TextColor } from "./colors";
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
} from "./table";
import {
  ImageSettings,
  ImageAlignCenter,
  ImageAlignLeft,
  ImageAlignRight,
  ImageProperties,
} from "./image";
import {
  AttachmentSettings,
  DownloadAttachment,
  RemoveAttachment,
} from "./attachment";
import {
  EmbedAlignCenter,
  EmbedAlignLeft,
  EmbedAlignRight,
  EmbedProperties,
  EmbedSettings,
} from "./embed";

export type ToolId = keyof typeof tools;
const tools = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
  strikethrough: Strikethrough,
  code: Code,
  subscript: Subscript,
  superscript: Superscript,
  clearformatting: ClearFormatting,
  link: Link,
  insertBlock: InsertBlock,
  numberedList: NumberedList,
  bulletList: BulletList,
  fontSize: FontSize,
  fontFamily: FontFamily,
  headings: Headings,
  alignCenter: AlignCenter,
  alignRight: AlignRight,
  alignLeft: AlignLeft,
  alignJustify: AlignJustify,
  ltr: LeftToRight,
  rtl: RightToLeft,
  textColor: TextColor,
  highlight: Highlight,

  imageSettings: ImageSettings,
  imageAlignCenter: ImageAlignCenter,
  imageAlignLeft: ImageAlignLeft,
  imageAlignRight: ImageAlignRight,
  imageProperties: ImageProperties,

  embedAlignCenter: EmbedAlignCenter,
  embedAlignLeft: EmbedAlignLeft,
  embedAlignRight: EmbedAlignRight,
  embedProperties: EmbedProperties,
  embedSettings: EmbedSettings,

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
};

export function findTool(id: ToolId): React.FunctionComponent<ToolProps> {
  return tools[id];
}
