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

import { useRef } from "react";
import { Button, Text } from "@theme-ui/components";
import { ThemeUIStyleObject } from "@theme-ui/css";
import { Menu } from "../../hooks/use-menu";
import { CaretDown, CaretDownOutline, Icon } from "../icons";

export type SelectOption = {
  value: string;
  title: string;
  disabled?: boolean;
};

export type SelectProps = {
  variant: "outline" | "filled";
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  icon?: Icon;
  menuPosition?: { align?: "start" | "end"; yOffset?: number };
  fallbackToFirst?: boolean;
  id?: string;
  sx?: ThemeUIStyleObject;
};

const variantStyles: Record<SelectProps["variant"], ThemeUIStyleObject> = {
  outline: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "spacing4",
    px: "spacing4",
    py: "spacing5",
    bg: "transparent",
    color: "heading",
    fontSize: "xs",
    fontWeight: 500,
    lineHeight: 1,
    border: "1px solid",
    borderColor: "border",
    borderRadius: "radius2",
    ":hover:not(:disabled)": { bg: "hover" }
  },
  filled: {
    height: "45px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "radius2",
    px: "spacing4",
    py: "spacing5",
    bg: "background-secondary",
    color: "paragraph",
    fontSize: "sm"
  }
};

export function Select(props: SelectProps) {
  const {
    variant,
    value,
    options,
    onChange,
    menuPosition,
    fallbackToFirst,
    id,
    sx
  } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isOutline = variant === "outline";
  const ActionIcon = props.icon || (isOutline ? CaretDownOutline : CaretDown);
  const selectedTitle =
    options.find((o) => value !== undefined && o.value === value)?.title ??
    (fallbackToFirst ? options[0]?.title : undefined);

  return (
    <Button
      id={id}
      ref={buttonRef}
      variant="secondary"
      onClick={() => {
        Menu.openMenu(
          options.map((o) => ({
            type: "button",
            key: o.value,
            title: o.title,
            isDisabled: o.disabled,
            isChecked: value !== undefined && o.value === value,
            onClick: () => onChange(o.value)
          })),
          {
            position: {
              target: buttonRef.current,
              isTargetAbsolute: true,
              location: "below",
              ...menuPosition
            }
          }
        );
      }}
      sx={{ ...variantStyles[variant], ...sx }}
    >
      {isOutline ? (
        <Text
          as="span"
          sx={{
            fontSize: "inherit",
            fontWeight: "inherit",
            color: "inherit",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {selectedTitle}
        </Text>
      ) : (
        selectedTitle
      )}
      {isOutline ? (
        <ActionIcon size={13} />
      ) : (
        <ActionIcon size={15} color="icon" />
      )}
    </Button>
  );
}
