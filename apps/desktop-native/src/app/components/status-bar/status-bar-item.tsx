/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import type { ReactNode } from "react";
import {
  Button,
  Text,
  type ButtonProps,
  type ColorValue,
  type SxProp
} from "@ui";
import type { Icon } from "../icons";

type StatusBarIconProps = {
  rotate?: boolean;
  rotateDirection?: "clockwise" | "counterclockwise";
  color?: ColorValue;
};

type CommonProps = { sx?: SxProp };

type StatusBarTextItemProps = CommonProps & {
  variant: "text";
  text: ReactNode;
  title?: string;
  testID?: string;
};

type StatusBarButtonProps = CommonProps &
  Pick<ButtonProps, "onPress" | "disabled" | "title" | "testID"> & {
    variant: "button";
    icon?: Icon;
    iconProps?: StatusBarIconProps;
    text?: ReactNode;
  };

export type StatusBarItemProps = StatusBarTextItemProps | StatusBarButtonProps;

const TEXT_STYLE: SxProp = {
  color: "paragraph",
  fontSize: "3xs"
};

function spin(direction: "clockwise" | "counterclockwise"): SxProp {
  const turn = direction === "clockwise" ? "360deg" : "-360deg";
  return {
    animation: {
      keyframes: {
        from: { transform: [{ rotate: "0deg" }] },
        to: { transform: [{ rotate: turn as `${number}deg` }] }
      },
      duration: 1000,
      iterationCount: "infinite",
      easing: "linear"
    }
  };
}

export function StatusBarItem(props: StatusBarItemProps) {
  if (props.variant === "text") {
    const { text, sx, title, testID } = props;
    return (
      <Text title={title} testID={testID} sx={{ ...TEXT_STYLE, ...sx }}>
        {text}
      </Text>
    );
  }

  const { icon: StatusIcon, iconProps, text, sx, ...buttonProps } = props;
  const hasText = text !== undefined;

  return (
    <Button
      {...buttonProps}
      variant="statusitem"
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        color: "paragraph",
        height: 15,
        borderRadius: "radius0",
        gap: "spacing3",
        ...(hasText ? { fontSize: "3xs", px: "spacing1", py: 0 } : { width: 15 }),
        ...sx
      }}
    >
      {StatusIcon ? (
        <StatusIcon
          size={13}
          color={iconProps?.color ?? "icon"}
          sx={
            iconProps?.rotate
              ? spin(iconProps.rotateDirection ?? "clockwise")
              : undefined
          }
        />
      ) : null}
      {hasText &&
      (StatusIcon || typeof text === "string" || typeof text === "number") ? (
        <Text sx={TEXT_STYLE}>{text}</Text>
      ) : (
        text
      )}
    </Button>
  );
}
