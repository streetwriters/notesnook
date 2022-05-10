import { Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript, ClearFormatting, Link, } from "./inline";
import { InsertBlock } from "./block";
import { FontSize, FontFamily } from "./font";
import { AlignCenter, AlignLeft, AlignRight, AlignJustify } from "./alignment";
// import {
//   Blockquote,
//   CodeBlock,
//   HorizontalRule,
//   Image,
//   Table,
//   Embed,
// } from "./block";
import { Headings } from "./headings";
import { NumberedList, BulletList } from "./lists";
import { LeftToRight, RightToLeft } from "./text-direction";
import { Highlight, TextColor } from "./colors";
// const tools = {
//   bold: new Bold(),
//   italic: new Italic(),
//   underline: new Underline(),
//   strikethrough: new Strikethrough(),
//   code: new Code(),
//   formatClear: new ClearFormatting(),
//   subscript: new Subscript(),
//   superscript: new Superscript(),
//   horizontalRule: new HorizontalRule(),
//   codeblock: new CodeBlock(),
//   blockquote: new Blockquote(),
//   headings: new Headings(),
//   checklist: new Checklist(),
//   link: new Link(),
//   image: new Image(),
//   attachment: new Attachment(),
//   table: new Table(),
//   embed: new Embed(),
// };
var tools = {
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
};
export function findToolById(id) {
    return tools[id];
}
