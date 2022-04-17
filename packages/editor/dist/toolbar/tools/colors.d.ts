/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { IconNames } from "../icons";
export declare const DEFAULT_COLORS: string[];
declare class ColorTool implements ITool {
    readonly id: ToolId;
    readonly title: string;
    private readonly icon;
    private readonly onColorChange;
    constructor(id: ToolId, title: string, icon: IconNames, onColorChange: (editor: Editor, color?: string) => void);
    render: (props: ToolProps) => JSX.Element;
}
export declare class Highlight extends ColorTool {
    constructor();
}
export declare class TextColor extends ColorTool {
    constructor();
}
declare type ColorPickerProps = {
    colors: string[];
    color: string;
    onClear: () => void;
    onChange: (color: string) => void;
};
export declare function ColorPicker(props: ColorPickerProps): JSX.Element;
export {};
