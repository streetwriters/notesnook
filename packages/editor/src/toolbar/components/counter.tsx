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

import React, { useRef, useState } from "react";
import { Flex } from "@theme-ui/components";
import { ToolButton } from "./tool-button.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { strings } from "@notesnook/intl";
import { MenuItem } from "@notesnook/ui";
import { ResponsivePresenter } from "../../components/responsive/index.js";

export type CounterProps = {
  title: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onReset: () => void;
  value: string;
  disabled?: boolean;
  menuItems?: MenuItem[];
};
function _Counter(props: CounterProps) {
  const { title, onDecrease, onIncrease, onReset, value, disabled, menuItems } =
    props;
  const toolbarLocation = useToolbarLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Flex
        ref={containerRef}
        sx={{
          alignItems: "stretch",
          borderRadius: "default",
          overflow: "hidden",
          height: "100%"
        }}
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

        <ToolButton
          toggled={false}
          variant="small"
          disabled={disabled}
          text={value}
          title={
            disabled ? "" : menuItems ? title : strings.clickToReset(title)
          }
          sx={{
            fontSize: "subBody",
            color: "paragraph",
            fontFamily: "body"
          }}
          onClick={
            disabled
              ? undefined
              : menuItems
              ? (e) => {
                  e.stopPropagation();
                  setIsMenuOpen((s) => !s);
                }
              : (e) => {
                  e.stopPropagation();
                  onReset();
                }
          }
        />

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
      {menuItems && (
        <ResponsivePresenter
          desktop="menu"
          mobile="sheet"
          title={title}
          isOpen={isMenuOpen}
          items={menuItems}
          onClose={() => setIsMenuOpen(false)}
          position={{
            target: containerRef.current || undefined,
            isTargetAbsolute: true,
            location: toolbarLocation === "bottom" ? "top" : "below",
            yOffset: 5
          }}
        />
      )}
    </>
  );
}

export const Counter = React.memo(_Counter, (prev, next) => {
  return prev.value === next.value && prev.disabled === next.disabled;
});
