import React from "react";
import { ToolProps } from "../types";
declare type ColorToolProps = ToolProps & {
    onColorChange: (color?: string) => void;
    getActiveColor: () => string;
    title: string;
    cacheKey: string;
};
declare function _ColorTool(props: ColorToolProps): JSX.Element;
export declare const ColorTool: React.MemoExoticComponent<typeof _ColorTool>;
export declare function Highlight(props: ToolProps): JSX.Element;
export declare function TextColor(props: ToolProps): JSX.Element;
export {};
