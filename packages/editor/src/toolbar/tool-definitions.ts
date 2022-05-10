import { ToolDefinition } from "./types";
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
  link: {
    icon: "link",
    title: "Link",
  },
  code: {
    icon: "code",
    title: "Code",
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
};

export function getToolDefinition(id: ToolId) {
  return tools[id];
}
