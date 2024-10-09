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

import React from "react";
import { Flex, Text } from "@theme-ui/components";
import { ToolButton } from "./tool-button.js";
import { useIsMobile } from "../stores/toolbar-store.js";
import { strings } from "@notesnook/intl";

export type CounterProps = {
  title: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
  value: string;
  disabled?: boolean;
};
function _Counter(props: CounterProps) {
  const { title, onDecrease, onIncrease, onReset, value, disabled } = props;
  const isMobile = useIsMobile();

  return (
    <Flex
      sx={{
        alignItems: "stretch",
        borderRadius: "default",
        overflow: "hidden",
        cursor: disabled ? "not-allowed" : "pointer",
        height: "100%",
        ":hover": {
          bg: isMobile || disabled ? "transparent" : "hover-secondary"
        }
      }}
      onClick={disabled ? undefined : onReset}
      title={disabled ? "" : strings.clickToReset(title)}
    >
      <ToolButton
        toggled={false}
        title={strings.decrease(title)}
        icon="minus"
        variant={"small"}
        disabled={disabled}
        onClick={
          disabled
            ? undefined
            : (e) => {
                e.stopPropagation();
                onDecrease();
              }
        }
      />

      <Text
        sx={{
          color: "paragraph",
          fontSize: "subBody",
          alignSelf: "center",
          mx: 1,
          textAlign: "center",
          opacity: disabled ? 0.5 : 1
        }}
      >
        {value}
      </Text>

      <ToolButton
        toggled={false}
        title={strings.increase(title)}
        icon="plus"
        variant={"small"}
        disabled={disabled}
        onClick={
          disabled
            ? undefined
            : (e) => {
                e.stopPropagation();
                onIncrease();
              }
        }
      />
    </Flex>
  );
}

export const Counter = React.memo(_Counter, (prev, next) => {
  return prev.value === next.value && prev.disabled === next.disabled;
});
