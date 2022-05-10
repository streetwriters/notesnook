/// <reference types="react" />
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { Editor } from "@tiptap/core";
import { ToolbarLocation } from "./hooks/useToolbarContext";
declare type ToolbarProps = ThemeConfig & {
    editor: Editor | null;
    location: ToolbarLocation;
};
export declare function Toolbar(props: ToolbarProps): JSX.Element | null;
export {};
