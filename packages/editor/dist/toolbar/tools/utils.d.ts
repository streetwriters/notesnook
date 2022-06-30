import { Editor } from "@tiptap/core";
import { MenuButton } from "../../components/menu/types";
import { ToolProps } from "../types";
export declare function menuButtonToTool(constructItem: (editor: Editor) => MenuButton): (props: ToolProps) => JSX.Element;
