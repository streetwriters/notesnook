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

import { Button, ButtonProps, Text, RestrictedSxProp } from "@notesnook/ui";
import { ForwardedRef, ReactNode, forwardRef } from "react";
import { Icon, IconProps } from "../icons";

type CommonProps = { sx?: RestrictedSxProp; className?: string };

type NativeButtonProps = Omit<
  ButtonProps,
  "variant" | "sx" | "children" | "ref" | "className"
> & {
  "data-test-id"?: string;
};

type StatusBarIconProps = Pick<
  IconProps,
  "rotate" | "rotateDirection" | "color"
>;

export type StatusBarTextItemProps = CommonProps & {
  variant: "text";
  text: ReactNode;
  title?: string;
  "data-test-id"?: string;
};

// button needs an icon, text, or both
export type StatusBarButtonProps = CommonProps &
  NativeButtonProps & { variant: "button" } & (
    | { icon: Icon; iconProps?: StatusBarIconProps; text?: ReactNode }
    | { icon?: never; iconProps?: never; text: ReactNode }
  );

export type StatusBarItemProps = StatusBarTextItemProps | StatusBarButtonProps;

const TEXT_STYLE: RestrictedSxProp = {
  color: "paragraph",
  fontSize: "3xs"
};

function _StatusBarItem(
  props: StatusBarItemProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  if (props.variant === "text") {
    const { text, sx, className, title, "data-test-id": testId } = props;
    return (
      <Text
        className={className}
        title={title}
        data-test-id={testId}
        sx={{ ...TEXT_STYLE, ...sx } as RestrictedSxProp}
      >
        {text}
      </Text>
    );
  }

  const { icon: StatusIcon, iconProps, text, sx, ...buttonProps } = props;
  const hasText = text !== undefined;

  return (
    <Button
      {...buttonProps}
      ref={ref}
      variant="statusitem"
      sx={
        {
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
          color: "paragraph",
          height: "15px",
          borderRadius: "radius0",
          gap: "spacing3",
          ...(hasText ? { fontSize: "3xs", p: "spacing1" } : { width: "15px" }),
          ...sx
        } as RestrictedSxProp
      }
    >
      {StatusIcon ? <StatusIcon size={13} {...iconProps} /> : null}
      {StatusIcon && hasText ? <Text sx={TEXT_STYLE}>{text}</Text> : text}
    </Button>
  );
}

export const StatusBarItem = forwardRef(_StatusBarItem);
