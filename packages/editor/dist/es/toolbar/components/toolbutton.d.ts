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
    iconColor?: "text" | "background" | "border" | "blue" | "gray" | "green" | "orange" | "purple" | "red" | "yellow" | "checked" | "disabled" | "placeholder" | "icon" | "overlay" | "primary" | "bgSecondary" | keyof import("@notesnook/theme/dist/theme/colorscheme/static").StaticColors | "bgTransparent" | "accent" | "bgSecondaryText" | "bgSecondaryHover" | "hover" | "fontSecondary" | "fontTertiary" | "secondary" | undefined;
    iconSize?: number | "small" | "big" | "medium" | undefined;
    toggled: boolean;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined> | undefined;
    variant?: ToolButtonVariant | undefined;
}>;
