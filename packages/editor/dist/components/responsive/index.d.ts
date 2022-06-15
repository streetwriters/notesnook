import { PropsWithChildren } from "react";
import { ActionSheetPresenterProps } from "../action-sheet";
import { MenuPresenterProps } from "../menu";
declare type ResponsiveContainerProps = {
    mobile?: JSX.Element;
    desktop?: JSX.Element;
};
export declare function ResponsiveContainer(props: ResponsiveContainerProps): JSX.Element | null;
export declare function DesktopOnly(props: PropsWithChildren<{}>): JSX.Element;
export declare function MobileOnly(props: PropsWithChildren<{}>): JSX.Element;
export declare type PopupType = "sheet" | "menu" | "none";
export declare type ResponsivePresenterProps = MenuPresenterProps & ActionSheetPresenterProps & {
    mobile?: PopupType;
    desktop?: PopupType;
};
export declare function ResponsivePresenter(props: PropsWithChildren<ResponsivePresenterProps>): JSX.Element | null;
export {};
