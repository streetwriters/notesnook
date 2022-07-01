/// <reference types="react" />
import { ToolProps } from "../types";
import { ToolId } from "../tools";
declare type MoreToolsProps = ToolProps & {
    popupId: string;
    tools: ToolId[];
    autoCloseOnUnmount?: boolean;
};
export declare function MoreTools(props: MoreToolsProps): JSX.Element;
export {};
