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
import { ToolButton } from "./tool-button";

export type CounterProps = {
  title: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
  value: string;
};
function _Counter(props: CounterProps) {
  const { title, onDecrease, onIncrease, onReset, value } = props;

  return (
    <Flex
      sx={{
        alignItems: "stretch",
        borderRadius: "default",
        overflow: "hidden",
        cursor: "pointer",
        ":hover": {
          bg: "hover-secondary"
        }
      }}
      onClick={onReset}
      title={`Click to reset ${title}`}
    >
      <ToolButton
        toggled={false}
        title={`Decrease ${title}`}
        icon="minus"
        variant={"small"}
        onClick={(e) => {
          e.stopPropagation();
          onDecrease();
        }}
      />

      <Text
        sx={{
          color: "paragraph",
          fontSize: "subBody",
          alignSelf: "center",
          mx: 1,
          textAlign: "center"
        }}
      >
        {value}
      </Text>

      <ToolButton
        toggled={false}
        title={`Increase ${title}`}
        icon="plus"
        variant={"small"}
        onClick={(e) => {
          e.stopPropagation();
          onIncrease();
        }}
      />
    </Flex>
  );
}

export const Counter = React.memo(_Counter, (prev, next) => {
  return prev.value === next.value;
});
