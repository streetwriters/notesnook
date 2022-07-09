import { PropsWithChildren } from "react";
import { PositionOptions } from "../../utils/position";
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
export declare type PopupWrapperProps = UsePopupHandlerOptions & {
    position: PositionOptions;
    renderPopup: (closePopup: () => void) => React.ReactNode;
} & Partial<Omit<PopupPresenterProps, "onClose">>;
export declare function PopupWrapper(props: PopupWrapperProps): null;
declare type UsePopupHandlerOptions = {
    id: string;
    group: string;
    isOpen: boolean;
    autoCloseOnUnmount?: boolean;
    onClosed?: () => void;
    onClosePopup?: () => void;
};
export declare function usePopupHandler(options: UsePopupHandlerOptions): {
    isPopupOpen: boolean;
    closePopup: (popupId: string) => void;
};
declare type ShowPopupOptions = {
    popup: (closePopup: () => void) => React.ReactNode;
} & Partial<ResponsivePresenterProps>;
export declare function showPopup(options: ShowPopupOptions): () => void;
export {};
