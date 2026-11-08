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

import { Button, Flex, Text, type MenuItem, type SxProp } from "@ui";
import { Menu } from "../../hooks/use-menu";
import { ChevronDown } from "../icons";

type DropdownOption = Omit<Extract<MenuItem, { type: "button" }>, "title"> & {
  title: string | (() => string);
};

type DropdownButtonProps = {
  options?: DropdownOption[];
  title?: string;
  sx?: SxProp;
  buttonStyle?: SxProp;
  chevronStyle?: SxProp;
};

export default function DropdownButton(props: DropdownButtonProps) {
  const { options, title, sx, buttonStyle, chevronStyle } = props;

  if (!options || !options.length) return null;
  const first = options[0];
  return (
    <Flex sx={{ flexDirection: "row", ...sx }}>
      <Button
        onPress={first.onClick}
        sx={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          ...buttonStyle
        }}
      >
        <Text>
          {typeof first.title === "function" ? first.title() : first.title}
        </Text>
      </Button>
      {options.length > 1 && (
        <Button
          onPress={(event) =>
            Menu.openMenu(
              options.slice(1).map((option) => ({
                ...option,
                title:
                  typeof option.title === "function"
                    ? option.title()
                    : option.title
              })),
              { title, position: { x: event.pageX, y: event.pageY } }
            )
          }
          sx={{
            px: 1,
            borderBottomLeftRadius: 0,
            borderTopLeftRadius: 0,
            ...chevronStyle
          }}
        >
          <ChevronDown color="accentForeground" size={18} />
        </Button>
      )}
    </Flex>
  );
}
