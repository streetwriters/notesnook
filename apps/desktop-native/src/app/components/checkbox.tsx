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

import { type ColorValue } from "@ui";
import { Checkbox as CheckboxIcon, CheckboxUnchecked } from "./icons";

type CheckboxProps = {
  checked: boolean;
  onToggle?: (ctrl: boolean) => void;
  "aria-label"?: string;
  testID?: string;
  size?: number;
  checkboxUncheckedIconColor: ColorValue;
};

export function Checkbox(props: CheckboxProps) {
  const {
    checked,
    onToggle,
    testID,
    size = 18,
    checkboxUncheckedIconColor
  } = props;

  const Icon = checked ? CheckboxIcon : CheckboxUnchecked;

  return (
    <Icon
      testID={testID}
      title={props["aria-label"]}
      onPress={(event) => {
        if (!onToggle) return;
        event.stopPropagation();
        onToggle(event.ctrlKey || event.metaKey);
      }}
      onKeyDown={(event) => {
        if (!onToggle) return;
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          onToggle(false);
        }
      }}
      size={size}
      color={checked ? "accent" : checkboxUncheckedIconColor}
      sx={{
        alignItems: "center",
        cursor: "pointer",
        flexShrink: 0,
        borderRadius: 5,
        ":focus-visible": { outlineColor: "accent", outlineWidth: 2 }
      }}
    />
  );
}
