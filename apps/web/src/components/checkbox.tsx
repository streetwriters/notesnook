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

import { Checkbox as CheckboxIcon, CheckboxUnchecked } from "./icons";

type CheckboxProps = {
  checked: boolean;
  onToggle?: (
    event:
      | React.MouseEvent<HTMLDivElement>
      | React.KeyboardEvent<HTMLDivElement>
  ) => void;
  "aria-label": string;
  "data-test-id"?: string;
  size?: number;
  checkboxUncheckedIconColor: string;
  checkboxUncheckedIconClassname?: string;
};

export function Checkbox(props: CheckboxProps) {
  const {
    checked,
    onToggle,
    "aria-label": ariaLabel,
    "data-test-id": dataTestId,
    size = 18,
    checkboxUncheckedIconColor,
    checkboxUncheckedIconClassname
  } = props;

  const Icon = checked ? CheckboxIcon : CheckboxUnchecked;

  return (
    <Icon
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={0}
      data-test-id={dataTestId}
      onClick={(event) => {
        if (!onToggle) return;

        event.stopPropagation();
        onToggle(event);
      }}
      onKeyDown={(event) => {
        if (!onToggle) return;

        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          onToggle(event);
        }
      }}
      size={size}
      color={checked ? "accent" : checkboxUncheckedIconColor}
      className={checked ? undefined : checkboxUncheckedIconClassname}
      sx={{
        alignItems: "center",
        cursor: "pointer",
        flexShrink: 0,
        borderRadius: "5px",
        ":focus-visible": {
          outline: "2px solid",
          outlineColor: "accent"
        }
      }}
    />
  );
}
