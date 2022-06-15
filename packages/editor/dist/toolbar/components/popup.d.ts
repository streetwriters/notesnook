import { PropsWithChildren } from "react";
export declare type PopupProps = {
    title?: string;
    onClose: () => void;
};
export declare function Popup(props: PropsWithChildren<PopupProps>): JSX.Element;
