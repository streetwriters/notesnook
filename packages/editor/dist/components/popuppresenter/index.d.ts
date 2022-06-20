import { PropsWithChildren } from "react";
import { PositionOptions } from "../../utils/position";
import { Theme } from "@notesnook/theme";
import React from "react";
import { ResponsivePresenterProps } from "../responsive";
export declare type PopupPresenterProps = {
    isOpen: boolean;
    onClose: () => void;
    position: PositionOptions;
    blocking?: boolean;
    focusOnRender?: boolean;
    movable?: boolean;
};
export declare function PopupPresenter(props: PropsWithChildren<PopupPresenterProps>): JSX.Element | null;
export declare type PopupWrapperProps = {
    id: string;
    group: string;
    position: PositionOptions;
    isOpen: boolean;
    onClosed?: () => void;
    renderPopup: (closePopup: () => void) => React.ReactNode;
} & Partial<Omit<PopupPresenterProps, "onClose">>;
export declare function PopupWrapper(props: PopupWrapperProps): null;
declare type ShowPopupOptions = {
    theme: Theme;
    popup: (closePopup: () => void) => React.ReactNode;
} & Partial<ResponsivePresenterProps>;
export declare function showPopup(options: ShowPopupOptions): void;
export {};
