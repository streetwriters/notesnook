/// <reference types="react" />
import { Editor } from "@tiptap/core";
import { ToolId } from "./tools";
export declare type ToolProps = {
    editor: Editor;
};
export interface ITool {
    id: ToolId;
    title: string;
    description?: string;
    render(props: ToolProps): JSX.Element;
}
