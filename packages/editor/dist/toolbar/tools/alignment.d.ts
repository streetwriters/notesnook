/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { ToolId } from ".";
import { IconNames } from "../icons";
declare class AlignmentTool<TId extends ToolId, TTitle extends string> implements ITool {
    readonly id: TId;
    readonly title: TTitle;
    private readonly alignment;
    private readonly icon;
    constructor(id: TId, title: TTitle, alignment: "left" | "right" | "center" | "justify", icon: IconNames);
    render: (props: ToolProps) => JSX.Element;
}
export declare class AlignCenter extends AlignmentTool<ToolId, string> {
    constructor();
}
export declare class AlignRight extends AlignmentTool<ToolId, string> {
    constructor();
}
export declare class AlignLeft extends AlignmentTool<ToolId, string> {
    constructor();
}
export declare class AlignJustify extends AlignmentTool<ToolId, string> {
    constructor();
}
export {};
