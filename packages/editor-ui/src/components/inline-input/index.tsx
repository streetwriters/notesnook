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

import { Flex, Input, Text, type InputProps, type FlexProps } from "@ui";

type LabelInputProps = InputProps & {
  label: string;
  containerProps?: FlexProps;
};
export function InlineInput(props: LabelInputProps) {
  const { label, containerProps, sx, ...inputProps } = props;

  return (
    <Flex
      {...containerProps}
      sx={{
        flex: 1,
        alignItems: "center",
        ...containerProps?.sx,
        border: "1px solid",
        borderColor: "border",
        p: 2,
        borderRadius: "default"
      }}
    >
      <Input
        variant={"clean"}
        sx={{ flex: 1, ...sx, p: 0 }}
        {...inputProps}
      />
      <Text
        variant={"body"}
        sx={{
          flexShrink: 0,
          color: "paragraph",
          borderLeft: "1px solid",
          borderLeftColor: "border",
          pl: 1
        }}
      >
        {label}
      </Text>
    </Flex>
  );
}
