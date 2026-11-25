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

import { ReactNode } from "react";
import { Label, Text } from "@theme-ui/components";
import { ThemeUIStyleObject } from "@theme-ui/css";

type RadioButtonProps = {
  id: string;
  name: string;
  label: string;
  selected: boolean;
  value?: string;
  testId?: string;
  disabled?: boolean;
  proIcon?: ReactNode;
  sx?: ThemeUIStyleObject;
  onSelect?: () => void;
};

export function RadioButton(props: RadioButtonProps) {
  const {
    id,
    name,
    label,
    selected,
    value,
    testId,
    disabled,
    proIcon,
    sx,
    onSelect
  } = props;

  return (
    <Label
      data-test-id={testId}
      variant="text.body"
      sx={{
        minWidth: 0,
        width: "auto",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "space-between",
        gap: "spacing4",
        px: "spacing4",
        py: "spacing5",
        border: "1px solid",
        borderColor: selected ? "transparent" : "border",
        borderRadius: "radius2",
        bg: selected ? "background-selected" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        ":hover:not(:active)": { bg: disabled ? "transparent" : "hover" },
        ...sx
      }}
    >
      {proIcon}
      <Text
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: selected ? "paragraph-selected" : "paragraph",
          fontWeight: selected ? 500 : 400,
          fontSize: "sm",
          lineHeight: 1
        }}
      >
        {label}
      </Text>
      <input
        id={id}
        name={name}
        type="radio"
        value={value ?? id}
        checked={selected}
        disabled={disabled}
        onChange={() => onSelect?.()}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          flexShrink: 0,
          width: 16,
          height: 16,
          margin: 0,
          borderRadius: "50%",
          cursor: "inherit",
          border: `1px solid var(--${selected ? "accent" : "paragraph"})`,
          backgroundColor: selected ? "var(--accent)" : "transparent",
          boxShadow: selected ? "inset 0 0 0 3px var(--background)" : "none"
        }}
      />
    </Label>
  );
}
