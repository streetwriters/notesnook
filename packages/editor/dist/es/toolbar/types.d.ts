import { Editor } from "../types";
import { IconNames } from "./icons";
import { ToolId } from "./tools";
import { NodeWithOffset } from "./utils/prosemirror";
export declare type ToolButtonVariant = "small" | "normal";
export declare type ToolProps = ToolDefinition & {
    editor: Editor;
    variant?: ToolButtonVariant;
    force?: boolean;
    selectedNode?: NodeWithOffset;
};
export declare type ToolDefinition = {
    icon: IconNames;
    title: string;
    conditional?: boolean;
    description?: string;
};
export declare type ToolbarGroupDefinition = (ToolId | ToolId[])[];
export declare type ToolbarDefinition = ToolbarGroupDefinition[];
