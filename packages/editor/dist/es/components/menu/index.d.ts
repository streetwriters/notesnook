import { PropsWithChildren } from "react";
import { FlexProps } from "rebass";
import { MenuItem as MenuItemType } from "./types";
import { PopupPresenterProps } from "../popup-presenter";
declare type MenuProps = MenuContainerProps & {
    items?: MenuItemType[];
    onClose: () => void;
};
export declare function Menu(props: MenuProps): JSX.Element;
declare type MenuContainerProps = FlexProps & {
    title?: string;
};
export declare type MenuPresenterProps = PopupPresenterProps & MenuProps;
export declare function MenuPresenter(props: PropsWithChildren<MenuPresenterProps>): JSX.Element;
export {};
