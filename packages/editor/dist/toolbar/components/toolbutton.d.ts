import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import React from "react";
import { ButtonProps } from "rebass";
import { IconNames } from "../icons";
import { ToolButtonVariant } from "../types";
export declare type ToolButtonProps = ButtonProps & {
    icon: IconNames;
    iconColor?: keyof SchemeColors;
    iconSize?: number;
    toggled: boolean;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined>;
    variant?: ToolButtonVariant;
};
export declare function ToolButton(props: ToolButtonProps): JSX.Element;
