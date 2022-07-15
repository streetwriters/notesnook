/// <reference types="react" />
import { Theme } from "@streetwriters/theme";
import { Editor } from "../types";
import { FlexProps } from "rebass";
import { ToolbarLocation } from "./stores/toolbar-store";
import { ToolbarDefinition } from "./types";
declare type ToolbarProps = FlexProps & {
    theme: Theme;
    editor: Editor | null;
    location: ToolbarLocation;
    tools?: ToolbarDefinition;
};
export declare function Toolbar(props: ToolbarProps): JSX.Element | null;
export {};
