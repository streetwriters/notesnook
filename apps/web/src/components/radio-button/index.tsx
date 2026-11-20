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

/** A pill-shaped radio option; call sites override the defaults via props. */
type RadioButtonProps = {
  id: string;
  name: string;
  label: string;
  selected: boolean;
  value?: string;
  testId?: string;
  disabled?: boolean;
  /** Rendered next to the label, e.g. a Pro crown for premium options. */
  proIcon?: ReactNode;
  /** "start" puts `proIcon` before the label, "end" after the radio. */
  proIconPlacement?: "start" | "end";
  /** Diameter of the radio in px. */
  radioSize?: number;
  /** Ring colour of an unselected radio (theme colour name). */
  radioRingColor?: string;
  /** Colour of the gap between the selected radio's ring and its dot. */
  radioGapColor?: string;
  /** "border" is a 1px border; "inset" is a box-shadow inside the padding. */
  outline?: "border" | "inset";
  /** Show the hover background on enabled options. */
  hoverable?: boolean;
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
    proIconPlacement = "start",
    radioSize = 16,
    radioRingColor = "paragraph",
    radioGapColor = "background",
    outline = "border",
    hoverable = true,
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
        ...(outline === "border"
          ? {
              border: "1px solid",
              borderColor: selected ? "transparent" : "border"
            }
          : {
              boxShadow: selected ? "none" : "inset 0 0 0 1px var(--border)"
            }),
        borderRadius: "radius2",
        bg: selected ? "background-selected" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        ...(hoverable
          ? {
              ":hover:not(:active)": { bg: disabled ? "transparent" : "hover" }
            }
          : {}),
        ...sx
      }}
    >
      {proIcon && proIconPlacement === "start" ? proIcon : null}
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
          width: radioSize,
          height: radioSize,
          margin: 0,
          borderRadius: "50%",
          cursor: "inherit",
          border: `1px solid var(--${selected ? "accent" : radioRingColor})`,
          backgroundColor: selected ? "var(--accent)" : "transparent",
          boxShadow: selected
            ? `inset 0 0 0 3px var(--${radioGapColor})`
            : "none"
        }}
      />
      {proIcon && proIconPlacement === "end" ? proIcon : null}
    </Label>
  );
}
