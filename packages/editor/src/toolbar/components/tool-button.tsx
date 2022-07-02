import { Theme } from "@notesnook/theme";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { useTheme } from "emotion-theming";
import React from "react";
import { ButtonProps } from "rebass";
import { IconNames, Icons } from "../icons";
import { ToolButtonVariant } from "../types";
import { Button } from "../../components/button";
import { Icon } from "./icon";

export type ToolButtonProps = ButtonProps & {
  icon: IconNames;
  iconColor?: keyof SchemeColors;
  iconSize?: keyof Theme["iconSizes"] | number;
  toggled: boolean;
  buttonRef?: React.MutableRefObject<HTMLButtonElement | null | undefined>;
  variant?: ToolButtonVariant;
};
export const ToolButton = React.memo(
  function ToolButton(props: ToolButtonProps) {
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
        id={`tool-${id || icon}`}
        sx={{
          flexShrink: 0,
          p: variant === "small" ? "small" : 1,
          borderRadius: variant === "small" ? "small" : "default",
          m: 0,
          bg: toggled ? "hover" : "transparent",
          mr: variant === "small" ? 0 : 1,
          ":hover": { bg: ["transparent", "hover"] },
          ":active": { bg: "hover" },
          ":last-of-type": {
            mr: 0,
          },
          ...sx,
        }}
        onMouseDown={(e) => e.preventDefault()}
        {...buttonProps}
      >
        <Icon
          path={Icons[icon]}
          color={iconColor || "icon"}
          size={iconSize || (variant === "small" ? "medium" : "big")}
        />
      </Button>
    );
  },
  (prev, next) => {
    return prev.toggled === next.toggled && prev.icon === next.icon;
  }
);
