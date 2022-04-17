import { ButtonProps } from "rebass";
import { IconNames } from "../icons";
import { PropsWithChildren } from "react";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
declare type PopupProps = {
    title?: string;
    action?: PopupButtonProps;
};
export declare function Popup(props: PropsWithChildren<PopupProps>): JSX.Element;
declare type PopupButtonProps = ButtonProps & {
    text?: string;
    loading?: boolean;
    icon?: IconNames;
    iconSize?: number;
    iconColor?: keyof SchemeColors;
};
export {};
