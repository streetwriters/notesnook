/// <reference types="react" />
import { Editor } from "@tiptap/core";
import { ToolProps } from "../types";
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
