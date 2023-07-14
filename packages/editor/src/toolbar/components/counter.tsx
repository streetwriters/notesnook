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
import { Flex } from "@theme-ui/components";
import { Button } from "../../components/button";
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
        alignItems: "center",
        mr: 1,
        ":last-of-type": {
          mr: 0
        }
      }}
    >
      <ToolButton
        toggled={false}
        title={`Decrease ${title}`}
        icon="minus"
        variant={"small"}
        onClick={onDecrease}
      />

      <Button
        sx={{
          color: "paragraph",
          px: 0,
          fontSize: "subBody",
          mx: 1,
          textAlign: "center"
        }}
        onClick={onReset}
        title={`Reset ${title}`}
      >
        {value}
      </Button>

      <ToolButton
        toggled={false}
        title={`Increase ${title}`}
        icon="plus"
        variant={"small"}
        onClick={onIncrease}
      />
    </Flex>
  );
}

export const Counter = React.memo(_Counter, (prev, next) => {
  return prev.value === next.value;
});
