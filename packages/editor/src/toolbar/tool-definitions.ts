import { ToolbarDefinition, ToolDefinition } from "./types";
import { ToolId } from "./tools";

const tools: Record<ToolId, ToolDefinition> = {
  bold: {
    icon: "bold",
    title: "Bold",
  },
  italic: {
    icon: "italic",
    title: "Italic",
  },
  underline: {
    icon: "underline",
    title: "Underline",
  },
  strikethrough: {
    icon: "strikethrough",
    title: "Strikethrough",
  },
  addLink: {
    icon: "link",
    title: "Link",
  },
  editLink: {
    icon: "linkEdit",
    title: "Edit link",
    conditional: true,
  },
  removeLink: {
    icon: "linkRemove",
    title: "Remove link",
    conditional: true,
  },
  openLink: {
    icon: "openLink",
    title: "Open link",
    conditional: true,
  },
  linkSettings: {
    icon: "linkSettings",
    title: "Link settings",
    conditional: true,
  },
  code: {
    icon: "code",
    title: "Code",
  },
  codeRemove: {
    icon: "codeRemove",
    title: "Code",
    conditional: true,
  },
  clearformatting: {
    icon: "formatClear",
    title: "Clear all formatting",
  },
  subscript: {
    icon: "subscript",
    title: "Subscript",
  },
  superscript: {
    icon: "superscript",
    title: "Superscript",
  },
  insertBlock: {
    icon: "plus",
    title: "Insert",
  },
  bulletList: {
    icon: "bulletList",
    title: "Bullet list",
  },
  numberedList: {
    icon: "numberedList",
    title: "Numbered list",
  },
  fontFamily: {
    icon: "none",
    title: "Font family",
  },
  fontSize: {
    icon: "none",
    title: "Font size",
  },
  headings: {
    icon: "none",
    title: "Headings",
  },
  alignCenter: {
    icon: "alignCenter",
    title: "Align center",
  },
  alignLeft: {
    icon: "alignLeft",
    title: "Align left",
  },
  alignRight: {
    icon: "alignRight",
    title: "Align right",
  },
  alignJustify: {
    icon: "alignJustify",
    title: "Justify",
  },
  ltr: {
    icon: "ltr",
    title: "Left to right",
  },
  rtl: {
    icon: "rtl",
    title: "Right to left",
  },
  highlight: {
    icon: "highlight",
    title: "Highlight",
  },
  textColor: {
    icon: "textColor",
    title: "Text color",
  },
  math: {
    icon: "math",
    title: "Math (inline)",
  },

  tableSettings: {
    icon: "tableSettings",
    title: "Table settings",
    conditional: true,
  },
  columnProperties: {
    icon: "columnProperties",
    title: "Column properties",
    conditional: true,
  },
  rowProperties: {
    icon: "rowProperties",
    title: "Row properties",
    conditional: true,
  },
  cellProperties: {
    icon: "cellProperties",
    title: "Cell properties",
    conditional: true,
  },
  insertColumnLeft: {
    icon: "insertColumnLeft",
    title: "Insert column left",
    conditional: true,
  },
  insertColumnRight: {
    icon: "insertColumnRight",
    title: "Insert column right",
    conditional: true,
  },
  moveColumnLeft: {
    icon: "moveColumnLeft",
    title: "Move column left",
    conditional: true,
  },
  moveColumnRight: {
    icon: "moveColumnRight",
    title: "Move column right",
    conditional: true,
  },
  deleteColumn: {
    icon: "deleteColumn",
    title: "Delete column",
    conditional: true,
  },
  splitCells: {
    icon: "splitCells",
    title: "Split cells",
    conditional: true,
  },
  mergeCells: {
    icon: "mergeCells",
    title: "Merge cells",
    conditional: true,
  },
  insertRowAbove: {
    icon: "insertRowAbove",
    title: "Insert row above",
    conditional: true,
  },
  insertRowBelow: {
    icon: "insertRowBelow",
    title: "Insert row below",
    conditional: true,
  },
  moveRowUp: {
    icon: "moveRowUp",
    title: "Move row up",
    conditional: true,
  },
  moveRowDown: {
    icon: "moveRowDown",
    title: "Move row down",
    conditional: true,
  },
  deleteRow: {
    icon: "deleteRow",
    title: "Delete row",
    conditional: true,
  },
  deleteTable: {
    icon: "deleteTable",
    title: "Delete table",
    conditional: true,
  },
  cellBackgroundColor: {
    icon: "backgroundColor",
    title: "Cell background color",
    conditional: true,
  },
  cellBorderColor: {
    icon: "cellBorderColor",
    title: "Cell border color",
    conditional: true,
  },
  cellTextColor: {
    icon: "textColor",
    title: "Cell text color",
    conditional: true,
  },
  cellBorderWidth: {
    icon: "none",
    title: "Cell border width",
    conditional: true,
  },

  imageSettings: {
    icon: "imageSettings",
    title: "Image settings",
    conditional: true,
  },
  imageAlignCenter: {
    icon: "alignCenter",
    title: "Align center",
    conditional: true,
  },
  imageAlignLeft: {
    icon: "alignLeft",
    title: "Align left",
    conditional: true,
  },
  imageAlignRight: {
    icon: "alignRight",
    title: "Align right",
    conditional: true,
  },
  imageProperties: {
    icon: "more",
    title: "Image properties",
    conditional: true,
  },
  attachmentSettings: {
    icon: "attachmentSettings",
    title: "Attachment settings",
    conditional: true,
  },
  downloadAttachment: {
    icon: "download",
    title: "Download attachment",
    conditional: true,
  },
  removeAttachment: {
    icon: "delete",
    title: "Remove attachment",
    conditional: true,
  },
  embedSettings: {
    icon: "embedSettings",
    title: "Embed settings",
    conditional: true,
  },
  embedAlignCenter: {
    icon: "alignCenter",
    title: "Align center",
    conditional: true,
  },
  embedAlignLeft: {
    icon: "alignLeft",
    title: "Align left",
    conditional: true,
  },
  embedAlignRight: {
    icon: "alignRight",
    title: "Align right",
    conditional: true,
  },
  embedProperties: {
    icon: "more",
    title: "Embed properties",
    conditional: true,
  },
};

export function getToolDefinition(id: ToolId) {
  return tools[id];
}

export function getAllTools() {
  return tools;
}

export const DEFAULT_TOOLS: ToolbarDefinition = [
  [
    "insertBlock",
    "tableSettings",
    "imageSettings",
    "embedSettings",
    "attachmentSettings",
    "linkSettings",
    "codeRemove",
  ],
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
      "math",
    ],
  ],
  ["fontSize"],
  ["headings", "fontFamily"],
  ["numberedList", "bulletList"],
  ["addLink"],
  ["alignCenter", ["alignLeft", "alignRight", "alignJustify", "ltr", "rtl"]],
  ["clearformatting"],
];
