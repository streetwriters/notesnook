/// <reference types="react" />
import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
declare type ColorToolProps = ToolProps & {
    onColorChange: (editor: Editor, color?: string) => void;
    isActive: (editor: Editor) => boolean;
    getActiveColor: (editor: Editor) => string;
    title: string;
};
export declare function ColorTool(props: ColorToolProps): JSX.Element;
export declare function Highlight(props: ToolProps): JSX.Element;
export declare function TextColor(props: ToolProps): JSX.Element;
export {};
