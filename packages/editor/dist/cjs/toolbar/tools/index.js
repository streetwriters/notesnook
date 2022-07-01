"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTool = void 0;
const inline_1 = require("./inline");
const block_1 = require("./block");
const font_1 = require("./font");
const alignment_1 = require("./alignment");
const headings_1 = require("./headings");
const lists_1 = require("./lists");
const textdirection_1 = require("./textdirection");
const colors_1 = require("./colors");
const table_1 = require("./table");
const image_1 = require("./image");
const attachment_1 = require("./attachment");
const embed_1 = require("./embed");
const link_1 = require("./link");
const tools = {
    bold: inline_1.Bold,
    italic: inline_1.Italic,
    underline: inline_1.Underline,
    strikethrough: inline_1.Strikethrough,
    code: inline_1.Code,
    codeRemove: inline_1.CodeRemove,
    subscript: inline_1.Subscript,
    superscript: inline_1.Superscript,
    clearformatting: inline_1.ClearFormatting,
    addLink: link_1.AddLink,
    editLink: link_1.EditLink,
    removeLink: link_1.RemoveLink,
    linkSettings: link_1.LinkSettings,
    openLink: link_1.OpenLink,
    insertBlock: block_1.InsertBlock,
    numberedList: lists_1.NumberedList,
    bulletList: lists_1.BulletList,
    fontSize: font_1.FontSize,
    fontFamily: font_1.FontFamily,
    headings: headings_1.Headings,
    alignCenter: alignment_1.AlignCenter,
    alignRight: alignment_1.AlignRight,
    alignLeft: alignment_1.AlignLeft,
    alignJustify: alignment_1.AlignJustify,
    ltr: textdirection_1.LeftToRight,
    rtl: textdirection_1.RightToLeft,
    textColor: colors_1.TextColor,
    highlight: colors_1.Highlight,
    math: inline_1.Math,
    imageSettings: image_1.ImageSettings,
    imageAlignCenter: image_1.ImageAlignCenter,
    imageAlignLeft: image_1.ImageAlignLeft,
    imageAlignRight: image_1.ImageAlignRight,
    imageProperties: image_1.ImageProperties,
    embedAlignCenter: embed_1.EmbedAlignCenter,
    embedAlignLeft: embed_1.EmbedAlignLeft,
    embedAlignRight: embed_1.EmbedAlignRight,
    embedProperties: embed_1.EmbedProperties,
    embedSettings: embed_1.EmbedSettings,
    attachmentSettings: attachment_1.AttachmentSettings,
    downloadAttachment: attachment_1.DownloadAttachment,
    removeAttachment: attachment_1.RemoveAttachment,
    tableSettings: table_1.TableSettings,
    columnProperties: table_1.ColumnProperties,
    rowProperties: table_1.RowProperties,
    cellProperties: table_1.CellProperties,
    insertColumnLeft: table_1.InsertColumnLeft,
    insertColumnRight: table_1.InsertColumnRight,
    moveColumnLeft: table_1.MoveColumnLeft,
    moveColumnRight: table_1.MoveColumnRight,
    deleteColumn: table_1.DeleteColumn,
    splitCells: table_1.SplitCells,
    mergeCells: table_1.MergeCells,
    cellBackgroundColor: table_1.CellBackgroundColor,
    cellBorderColor: table_1.CellBorderColor,
    cellTextColor: table_1.CellTextColor,
    cellBorderWidth: table_1.CellBorderWidth,
    insertRowAbove: table_1.InsertRowAbove,
    insertRowBelow: table_1.InsertRowBelow,
    moveRowUp: table_1.MoveRowUp,
    moveRowDown: table_1.MoveRowDown,
    deleteRow: table_1.DeleteRow,
    deleteTable: table_1.DeleteTable,
};
function findTool(id) {
    return tools[id];
}
exports.findTool = findTool;
