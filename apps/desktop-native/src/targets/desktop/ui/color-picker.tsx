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

import { forwardRef } from "react";
import type * as Contract from "../../../ui/primitives";
import type { UIElement } from "../../../ui/primitives";
import { Box, Flex, Input } from "./primitives";

export const ColorPicker = forwardRef<UIElement, Contract.ColorPickerProps>(
  function ColorPicker(props, ref) {
    return (
      <Flex
        ref={ref}
        testID={props.testID}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          gap: "spacing3",
          ...props.sx
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: "radius2",
            bg: props.value as never,
            border: "1px solid",
            borderColor: "border"
          }}
        />
        <Input
          type="text"
          defaultValue={props.value}
          onChangeText={props.onChange}
          sx={{ width: 100 }}
        />
      </Flex>
    );
  }
);
