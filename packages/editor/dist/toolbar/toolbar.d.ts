/// <reference types="react" />
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { Editor } from "@tiptap/core";
declare type ToolbarProps = ThemeConfig & {
    editor: Editor | null;
};
export declare function Toolbar(props: ToolbarProps): JSX.Element | null;
export {};
