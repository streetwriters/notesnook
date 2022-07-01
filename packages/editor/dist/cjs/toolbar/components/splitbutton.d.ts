import { PropsWithChildren } from "react";
import { ToolButtonProps } from "./tool-button";
import React from "react";
export declare type SplitButtonProps = ToolButtonProps & {
    onOpen: () => void;
};
declare function _SplitButton(props: PropsWithChildren<SplitButtonProps>): JSX.Element;
export declare const SplitButton: React.MemoExoticComponent<typeof _SplitButton>;
export {};
