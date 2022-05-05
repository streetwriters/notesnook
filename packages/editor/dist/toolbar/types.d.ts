import { Editor } from "@tiptap/core";
import { IconNames } from "./icons";
import { ToolId } from "./tools";
export declare type ToolProps = ToolDefinition & {
    editor: Editor;
    id: ToolId;
};
export declare type ToolDefinition = {
    icon: IconNames;
    title: string;
    description?: string;
};
