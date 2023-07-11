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

import { PropsWithChildren, useRef } from "react";
import { Flex } from "@theme-ui/components";
import { Icons } from "../icons";
import { Icon } from "@notesnook/ui";
import { ToolButton, ToolButtonProps } from "./tool-button";
import { useToolbarLocation } from "../stores/toolbar-store";

import { Button } from "../../components/button";
import React from "react";

export type SplitButtonProps = ToolButtonProps & { onOpen: () => void };
function _SplitButton(props: PropsWithChildren<SplitButtonProps>) {
  const { children, onOpen, sx, ...toolButtonProps } = props;

  const ref = useRef<HTMLDivElement>(null);
  const toolbarLocation = useToolbarLocation();

  return (
    <>
      <Flex
        ref={ref}
        sx={{
          borderRadius: "default",
          flexShrink: 0,
          alignItems: "center"
        }}
      >
        <ToolButton
          {...toolButtonProps}
          sx={{ mr: 0, ":hover": { bg: "hover" }, ...sx }}
          toggled={false}
        />
        <Button
          sx={{
            flexShrink: 0,
            p: 0,
            m: 0,
            px: "3px",
            bg: "background",
            ":hover": { bg: "hover" },
            ":last-of-type": {
              mr: 0
            }
          }}
          onClick={onOpen}
        >
          <Icon
            path={
              toolbarLocation === "bottom" ? Icons.chevronUp : Icons.chevronDown
            }
            size={"small"}
            sx={{ flexShrink: 0 }}
          />
        </Button>
      </Flex>
      {children}
    </>
  );
}
export const SplitButton = React.memo(_SplitButton, (prev, next) => {
  return (
    prev.toggled === next.toggled &&
    JSON.stringify(prev.sx) === JSON.stringify(next.sx) &&
    prev.children === next.children
  );
});
