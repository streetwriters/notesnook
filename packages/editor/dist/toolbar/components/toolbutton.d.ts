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
    iconColor?: "icon" | "text" | "blue" | "gray" | "green" | "orange" | "purple" | "red" | "yellow" | "checked" | "disabled" | "placeholder" | "background" | "border" | "overlay" | "hover" | keyof import("@notesnook/theme/dist/theme/colorscheme/static").StaticColors | "primary" | "bgTransparent" | "accent" | "bgSecondary" | "bgSecondaryText" | "fontSecondary" | "fontTertiary" | "secondary" | undefined;
    iconSize?: number | "medium" | "small" | "big" | undefined;
    toggled: boolean;
    buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined> | undefined;
    variant?: ToolButtonVariant | undefined;
}>;
