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

import { Flex } from "@theme-ui/components";
import { Checkbox, CheckboxUnchecked } from "../icons";

type ReminderCheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  checkboxUncheckedIconClassname?: string;
};

export function ReminderCheckbox(props: ReminderCheckboxProps) {
  const {
    checked,
    onToggle,
    size = 18,
    checkboxUncheckedIconClassname
  } = props;

  return (
    <Flex
      role="checkbox"
      aria-checked={checked}
      aria-label={
        checked ? "Mark reminder incomplete" : "Mark reminder complete"
      }
      tabIndex={0}
      data-test-id="reminder-complete"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }
      }}
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
    >
      {checked ? (
        <Checkbox size={size} color="accent" />
      ) : (
        <CheckboxUnchecked
          size={size}
          color="border"
          className={checkboxUncheckedIconClassname}
        />
      )}
    </Flex>
  );
}
