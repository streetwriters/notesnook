import React from "react";
import { ToolProps } from "../types";
import { Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript, ClearFormatting, Link, Attachment } from "./inline";
declare const tools: {
    bold: typeof Bold;
    italic: typeof Italic;
    underline: typeof Underline;
    strikethrough: typeof Strikethrough;
    code: typeof Code;
    subscript: typeof Subscript;
    superscript: typeof Superscript;
    clearformatting: typeof ClearFormatting;
    link: typeof Link;
    attachment: typeof Attachment;
};
export declare type ToolId = keyof typeof tools;
export declare function findToolById(id: ToolId): React.FunctionComponent<ToolProps>;
export {};
