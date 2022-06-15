import { PropsWithChildren } from "react";
import { ToolButtonProps } from "./tool-button";
export declare type SplitButtonProps = ToolButtonProps & {
    onOpen: () => void;
};
export declare function SplitButton(props: PropsWithChildren<SplitButtonProps>): JSX.Element;
