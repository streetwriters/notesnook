import { PropsWithChildren } from "react";
import { ToolButtonProps } from "./tool-button";
import { MenuPresenterProps } from "../../components/menu/menu";
declare type SplitButtonProps = ToolButtonProps & {
    menuPresenterProps?: Partial<MenuPresenterProps>;
};
export declare function SplitButton(props: PropsWithChildren<SplitButtonProps>): JSX.Element;
export {};
