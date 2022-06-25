/// <reference types="react" />
import { ToolbarGroupDefinition, ToolButtonVariant } from "../types";
import { FlexProps } from "rebass";
import { Editor } from "@tiptap/core";
import { NodeWithOffset } from "../utils/prosemirror";
export declare type ToolbarGroupProps = FlexProps & {
    tools: ToolbarGroupDefinition;
    editor: Editor;
    variant?: ToolButtonVariant;
    force?: boolean;
    selectedNode?: NodeWithOffset;
};
export declare function ToolbarGroup(props: ToolbarGroupProps): JSX.Element;
