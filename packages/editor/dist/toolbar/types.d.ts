import { Editor } from "@tiptap/core";
import { IconNames } from "./icons";
export declare type ToolProps = ToolDefinition & {
    editor: Editor;
};
export declare type ToolDefinition = {
    icon: IconNames;
    title: string;
    description?: string;
};
