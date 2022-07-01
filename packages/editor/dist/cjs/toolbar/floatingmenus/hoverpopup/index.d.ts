import { Editor } from "../../../types";
import { NodeWithOffset } from "../../utils/prosemirror";
import { FloatingMenuProps } from "../types";
export declare type HoverPopupProps = {
    editor: Editor;
    selectedNode: NodeWithOffset;
};
export declare function HoverPopupHandler(props: FloatingMenuProps): null;
