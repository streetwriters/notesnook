import { Theme } from "@notesnook/theme";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import React from "react";
import { ButtonProps } from "rebass";
import { IconNames } from "../icons";
import { ToolButtonVariant } from "../types";
export declare type ToolButtonProps = ButtonProps & {
    icon: IconNames;
    iconColor?: keyof SchemeColors;
    iconSize?: keyof Theme["iconSizes"] | number;
    toggled: boolean;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined>;
    variant?: ToolButtonVariant;
};
export declare const ToolButton: React.NamedExoticComponent<ButtonProps & {
    icon: IconNames;
    iconColor?: keyof import("@notesnook/theme/dist/theme/colorscheme/static").StaticColors | "primary" | "placeholder" | "background" | "bgTransparent" | "accent" | "bgSecondary" | "bgSecondaryText" | "bgSecondaryHover" | "border" | "hover" | "fontSecondary" | "fontTertiary" | "text" | "overlay" | "secondary" | "icon" | "disabled" | "checked" | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "gray" | undefined;
    iconSize?: number | "small" | "medium" | "big" | undefined;
    toggled: boolean;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined> | undefined;
    variant?: ToolButtonVariant | undefined;
}>;
