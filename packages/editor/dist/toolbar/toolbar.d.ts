/// <reference types="react" />
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { Editor } from "@tiptap/core";
import { ToolbarLocation } from "./stores/toolbar-store";
declare type ToolbarProps = ThemeConfig & {
    editor: Editor | null;
    location: ToolbarLocation;
    isMobile?: boolean;
};
export declare function Toolbar(props: ToolbarProps): JSX.Element | null;
export {};
