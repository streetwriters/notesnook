import { PropsWithChildren } from "react";
import { Editor } from "../../types";
declare type ResizerProps = {
    editor: Editor;
    selected: boolean;
    width?: number;
    height?: number;
    onResize: (width: number, height: number) => void;
};
export declare function Resizer(props: PropsWithChildren<ResizerProps>): JSX.Element;
export {};
