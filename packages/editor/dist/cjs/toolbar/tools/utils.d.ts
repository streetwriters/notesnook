/// <reference types="react" />
import { Editor } from "../../types";
import { MenuButton } from "../../components/menu/types";
import { ToolProps } from "../types";
export declare function menuButtonToTool(constructItem: (editor: Editor) => MenuButton): (props: ToolProps) => JSX.Element;
