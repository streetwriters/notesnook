import { PropsWithChildren } from "react";
import { MenuItem } from "../menu/types";
export declare type ActionSheetPresenterProps = {
    items?: MenuItem[];
    isOpen: boolean;
    onClose?: () => void;
    blocking?: boolean;
    focusOnRender?: boolean;
    title?: string;
};
export declare function ActionSheetPresenter(props: PropsWithChildren<ActionSheetPresenterProps>): JSX.Element | null;
