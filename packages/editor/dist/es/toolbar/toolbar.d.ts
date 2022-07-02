/// <reference types="react" />
import { Theme } from "@notesnook/theme";
import { Editor } from "@tiptap/core";
import { ToolbarLocation } from "./stores/toolbar-store";
import { ToolbarDefinition } from "./types";
declare type ToolbarProps = {
    theme: Theme;
    editor: Editor | null;
    location: ToolbarLocation;
    tools?: ToolbarDefinition;
};
export declare function Toolbar(props: ToolbarProps): JSX.Element | null;
export {};
