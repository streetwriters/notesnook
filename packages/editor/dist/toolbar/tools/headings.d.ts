/// <reference types="react" />
import { ITool, ToolProps } from "../types";
import { ToolId } from ".";
export declare class Headings implements ITool {
    title: string;
    id: ToolId;
    private defaultLevels;
    render: (props: ToolProps) => JSX.Element;
    private toMenuItems;
}
