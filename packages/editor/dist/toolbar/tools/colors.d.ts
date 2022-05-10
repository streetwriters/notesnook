/// <reference types="react" />
import { ToolProps } from "../types";
export declare const DEFAULT_COLORS: string[];
export declare function Highlight(props: ToolProps): JSX.Element;
export declare function TextColor(props: ToolProps): JSX.Element;
declare type ColorPickerProps = {
    colors: string[];
    color: string;
    onClear: () => void;
    onChange: (color: string) => void;
};
export declare function ColorPicker(props: ColorPickerProps): JSX.Element;
export {};
