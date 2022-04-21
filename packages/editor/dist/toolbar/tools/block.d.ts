/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { IconNames } from "../icons";
declare class BlockTool<TId extends ToolId> implements ITool {
    readonly id: TId;
    readonly title: string;
    private readonly icon;
    private readonly command;
    constructor(id: TId, title: string, icon: IconNames, command: (editor: Editor) => boolean);
    render: (props: ToolProps) => JSX.Element;
}
export declare class HorizontalRule extends BlockTool<ToolId> {
    constructor();
}
export declare class CodeBlock extends BlockTool<ToolId> {
    constructor();
}
export declare class Blockquote extends BlockTool<ToolId> {
    constructor();
}
export declare class Image implements ITool {
    id: ToolId;
    title: string;
    render: (props: ToolProps) => JSX.Element;
}
export declare class Embed implements ITool {
    id: ToolId;
    title: string;
    render: (props: ToolProps) => JSX.Element;
}
export declare class Table implements ITool {
    id: ToolId;
    title: string;
    private MAX_COLUMNS;
    private MAX_ROWS;
    private MIN_COLUMNS;
    private MIN_ROWS;
    render: (props: ToolProps) => JSX.Element;
    private getCellLocation;
    private isCellHighlighted;
}
export {};
