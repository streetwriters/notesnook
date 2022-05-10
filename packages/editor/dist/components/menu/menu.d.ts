import { PropsWithChildren } from "react";
import { FlexProps } from "rebass";
import { MenuOptions } from "./useMenu";
import { MenuItem as MenuItemType } from "./types";
declare type MenuProps = MenuContainerProps & {
    items: MenuItemType[];
    closeMenu: () => void;
};
export declare function Menu(props: MenuProps): JSX.Element;
declare type MenuContainerProps = FlexProps & {
    title?: string;
};
export declare type MenuPresenterProps = MenuContainerProps & {
    items: MenuItemType[];
    options: MenuOptions;
    isOpen: boolean;
    onClose: () => void;
    className?: string;
};
export declare function MenuPresenter(props: PropsWithChildren<MenuPresenterProps>): JSX.Element;
export {};
