/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { ToolId } from ".";
import { IconNames } from "../icons";
declare class InlineTool<TId extends ToolId> implements ITool {
    readonly id: TId;
    readonly title: string;
    private readonly icon;
    constructor(id: TId, title: string, icon: IconNames);
    render: (props: ToolProps) => JSX.Element;
}
export declare class Italic extends InlineTool<ToolId> {
    constructor();
}
export declare class Strikethrough extends InlineTool<ToolId> {
    constructor();
}
export declare class Underline extends InlineTool<ToolId> {
    constructor();
}
export declare class Code extends InlineTool<ToolId> {
    constructor();
}
export declare class Bold extends InlineTool<ToolId> {
    constructor();
}
export declare class Subscript extends InlineTool<ToolId> {
    constructor();
}
export declare class Superscript extends InlineTool<ToolId> {
    constructor();
}
export declare class ClearFormatting implements ITool {
    id: ToolId;
    title: string;
    render: (props: ToolProps) => JSX.Element;
}
export declare class Link implements ITool {
    id: ToolId;
    title: string;
    render: (props: ToolProps) => JSX.Element;
}
export {};
