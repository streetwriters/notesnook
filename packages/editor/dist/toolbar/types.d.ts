import { Editor } from "@tiptap/core";
import { IconNames } from "./icons";
import { ToolId } from "./tools";
export declare type ToolProps = ToolDefinition & {
    editor: Editor;
    variant?: "small" | "normal";
};
export declare type ToolDefinition = {
    icon: IconNames;
    title: string;
    conditional?: boolean;
    description?: string;
};
export declare type ToolbarGroupDefinition = (ToolId | ToolId[])[];
export declare type ToolbarDefinition = ToolbarGroupDefinition[];
