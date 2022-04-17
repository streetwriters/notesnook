/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { ToolId } from ".";
export declare class FontSize implements ITool {
    title: string;
    id: ToolId;
    private defaultFontSizes;
    render: (props: ToolProps) => JSX.Element;
}
export declare class FontFamily implements ITool {
    title: string;
    id: ToolId;
    private fontFamilies;
    render: (props: ToolProps) => JSX.Element;
    private toMenuItems;
}
