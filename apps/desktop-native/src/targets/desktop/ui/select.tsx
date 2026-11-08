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

import { forwardRef, useRef } from "react";
import type * as Contract from "../../../ui/primitives";
import type { UIElement } from "../../../ui/primitives";
import { useMenuStore } from "../../../app/components/menu/store";
import { CaretDown } from "../../../app/components/icons";
import { Button, Flex, Text } from "./primitives";

export const Select = forwardRef<UIElement, Contract.SelectProps>(
  function Select(props, ref) {
    const { options, value, onChange } = props;
    const trigger = useRef<UIElement>(null);
    const selected = options.find((option) => option.value === value);

    return (
      <Button
        ref={(node) => {
          trigger.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        testID={props.testID}
        onPress={() => {
          trigger.current?.measureInWindow((x, y, width, height) => {
            useMenuStore.getState().open(
              options.map((option) => ({
                type: "button" as const,
                key: String(option.value),
                title: option.title,
                isDisabled: option.disabled,
                isChecked: option.value === value,
                onClick: () => onChange?.(String(option.value))
              })),
              { x, y, width, height }
            );
          });
        }}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          gap: "spacing3",
          bg: "background-secondary",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "radius1",
          p: "5px",
          overflow: "hidden",
          ...props.sx
        }}
      >
        <Flex sx={{ flexDirection: "row", alignItems: "center" }}>
          <Text sx={{ color: "paragraph", fontSize: "xs" }}>
            {selected?.title ?? ""}
          </Text>
        </Flex>
        <CaretDown size={13} color="icon" />
      </Button>
    );
  }
);
