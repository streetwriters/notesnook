import { PropsWithChildren } from "react";
import { ToolButtonProps } from "./tool-button";
import { PopupPresenterProps } from "../../components/menu/menu";
declare type SplitButtonProps = ToolButtonProps & {
    popupPresenterProps?: Partial<PopupPresenterProps>;
};
export declare function SplitButton(props: PropsWithChildren<SplitButtonProps>): JSX.Element;
export {};
