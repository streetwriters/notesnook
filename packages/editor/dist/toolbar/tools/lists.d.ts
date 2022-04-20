/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolId } from ".";
import { IconNames } from "../icons";
declare type ListSubType<TListStyleTypes> = {
    items: string[];
    title: string;
    type: TListStyleTypes;
};
declare type ListOptions<TListStyleTypes> = {
    icon: IconNames;
    type: "bulletList" | "orderedList";
    onClick: (editor: Editor) => void;
    subTypes: ListSubType<TListStyleTypes>[];
};
declare class ListTool<TListStyleTypes extends string> implements ITool {
    readonly id: ToolId;
    readonly title: string;
    private readonly options;
    constructor(id: ToolId, title: string, options: ListOptions<TListStyleTypes>);
    render: (props: ToolProps) => JSX.Element;
}
declare type NumberedListStyleTypes = "lower-roman" | "upper-roman" | "lower-greek" | "lower-alpha" | "upper-alpha" | "decimal";
export declare class NumberedList extends ListTool<NumberedListStyleTypes> {
    constructor();
}
declare type BulletListStyleTypes = "circle" | "square" | "disc";
export declare class BulletList extends ListTool<BulletListStyleTypes> {
    constructor();
}
export declare class Checklist implements ITool {
    id: ToolId;
    title: string;
    render: (props: ToolProps) => JSX.Element;
}
export {};
