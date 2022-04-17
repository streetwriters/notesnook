/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { ToolId } from ".";
import { IconNames } from "../icons";
declare class TextDirectionTool<TId extends ToolId, TTitle extends string> implements ITool {
    readonly id: TId;
    readonly title: TTitle;
    private readonly icon;
    private readonly direction;
    constructor(id: TId, title: TTitle, icon: IconNames, direction: "ltr" | "rtl");
    render: (props: ToolProps) => JSX.Element;
}
export declare class LeftToRight extends TextDirectionTool<ToolId, string> {
    constructor();
}
export declare class RightToLeft extends TextDirectionTool<ToolId, string> {
    constructor();
}
export {};
