import { PropsWithChildren } from "react";
import { FlexProps } from "rebass";
import { MenuOptions } from "./useMenu";
import { MenuItem as MenuItemType } from "./types";
import "react-spring-bottom-sheet/dist/style.css";
declare type MenuProps = MenuContainerProps & {
    items: MenuItemType[];
    closeMenu: () => void;
};
export declare function Menu(props: MenuProps): JSX.Element;
declare type MenuContainerProps = FlexProps & {
    title?: string;
};
export declare type PopupType = "sheet" | "menu" | "none";
export declare type PopupPresenterProps = MenuPresenterProps & ActionSheetPresenterProps & {
    mobile?: PopupType;
    desktop?: PopupType;
};
export declare function PopupPresenter(props: PropsWithChildren<PopupPresenterProps>): JSX.Element | null;
export declare type MenuPresenterProps = MenuContainerProps & {
    items?: MenuItemType[];
    onClose?: () => void;
    isOpen: boolean;
    options?: MenuOptions;
};
export declare function MenuPresenter(props: PropsWithChildren<MenuPresenterProps>): JSX.Element;
export declare type ActionSheetPresenterProps = MenuContainerProps & {
    items?: MenuItemType[];
    isOpen: boolean;
    onClose?: () => void;
    blocking?: boolean;
};
export declare function ActionSheetPresenter(props: PropsWithChildren<ActionSheetPresenterProps>): JSX.Element;
export {};
