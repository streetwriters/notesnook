/// <reference types="react" />
import { Theme } from "@notesnook/theme";
import { Editor } from "@tiptap/core";
import { ToolbarLocation } from "./stores/toolbar-store";
declare type ToolbarProps = {
    theme: Theme;
    editor: Editor | null;
    location: ToolbarLocation;
    isMobile?: boolean;
};
export declare function Toolbar(props: ToolbarProps): JSX.Element | null;
export {};
