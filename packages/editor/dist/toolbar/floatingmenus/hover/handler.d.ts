import { Editor } from "../../../types";
export interface ElementHoverHandler<T extends string> {
    nodeName: T;
    handler: (editor: Editor) => void;
}
