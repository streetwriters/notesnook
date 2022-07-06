/// <reference types="react" />
import { ToolProps } from "../types";
declare type ColorToolProps = ToolProps & {
    onColorChange: (color?: string) => void;
    getActiveColor: () => string;
    title: string;
    cacheKey: string;
};
export declare function ColorTool(props: ColorToolProps): JSX.Element;
export declare function Highlight(props: ToolProps): JSX.Element;
export declare function TextColor(props: ToolProps): JSX.Element;
export {};
