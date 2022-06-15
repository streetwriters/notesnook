/// <reference types="react" />
import { ToolbarGroupDefinition } from "../types";
import { FlexProps } from "rebass";
import { Editor } from "@tiptap/core";
export declare type ToolbarGroupProps = FlexProps & {
    tools: ToolbarGroupDefinition;
    editor: Editor;
};
export declare function ToolbarGroup(props: ToolbarGroupProps): JSX.Element;
