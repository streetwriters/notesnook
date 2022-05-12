import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import React from "react";
import { Button, ButtonProps } from "rebass";
import { IconNames, Icons } from "../icons";
import { Icon } from "./icon";

export type ToolButtonProps = ButtonProps & {
  icon: IconNames;
  iconColor?: keyof SchemeColors;
  iconSize?: number;
  toggled: boolean;
  buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined>;
  variant?: "small" | "normal";
};
export function ToolButton(props: ToolButtonProps) {
  const {
    id,
    icon,
    iconSize,
    iconColor,
    toggled,
    sx,
    buttonRef,
    variant = "normal",
    ...buttonProps
  } = props;

  return (
    <Button
      ref={buttonRef}
      tabIndex={-1}
      id={`tool-${id}`}
      sx={{
        p: variant === "small" ? "3px" : 1,
        borderRadius: variant === "small" ? "small" : "default",
        m: 0,
        bg: toggled ? "hover" : "transparent",
        mr: variant === "small" ? 0 : 1,
        ":hover": { bg: "hover" },
        ":last-of-type": {
          mr: 0,
        },
        ...sx,
      }}
      {...buttonProps}
    >
      <Icon
        path={Icons[icon]}
        color={iconColor || "text"}
        size={iconSize || variant === "small" ? 16 : 18}
      />
    </Button>
  );
}
