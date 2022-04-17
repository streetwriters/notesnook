import { ITool } from "../types";
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
import { FontSize, FontFamily } from "./font";
import { AlignCenter, AlignLeft, AlignRight, AlignJustify } from "./alignment";
import {
  Blockquote,
  CodeBlock,
  HorizontalRule,
  Image,
  Attachment,
  Table,
} from "./block";
import { Headings } from "./headings";
import { NumberedList, BulletList } from "./lists";
import { LeftToRight, RightToLeft } from "./text-direction";
import { Highlight, TextColor } from "./colors";

const tools = {
  bold: new Bold(),
  italic: new Italic(),
  underline: new Underline(),
  strikethrough: new Strikethrough(),
  code: new Code(),
  formatClear: new ClearFormatting(),
  alignCenter: new AlignCenter(),
  alignRight: new AlignRight(),
  alignLeft: new AlignLeft(),
  alignJustify: new AlignJustify(),
  subscript: new Subscript(),
  superscript: new Superscript(),
  fontSize: new FontSize(),
  fontFamily: new FontFamily(),
  horizontalRule: new HorizontalRule(),
  codeblock: new CodeBlock(),
  blockquote: new Blockquote(),
  headings: new Headings(),
  ltr: new LeftToRight(),
  rtl: new RightToLeft(),
  numberedList: new NumberedList(),
  bulletList: new BulletList(),
  textColor: new TextColor(),
  highlight: new Highlight(),
  link: new Link(),
  image: new Image(),
  attachment: new Attachment(),
  table: new Table(),
};
export type ToolId = keyof typeof tools;
export function findToolById(id: ToolId): ITool {
  return tools[id];
}
