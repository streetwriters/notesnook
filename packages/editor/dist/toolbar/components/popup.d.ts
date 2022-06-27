import { PropsWithChildren } from "react";
declare type Action = {
    title: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
};
export declare type PopupProps = {
    title?: string;
    onClose?: () => void;
    action?: Action;
};
export declare function Popup(props: PropsWithChildren<PopupProps>): JSX.Element;
export {};
