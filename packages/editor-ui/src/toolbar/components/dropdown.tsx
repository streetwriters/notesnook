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

import { useRef } from "react";
import { Icon, Text, type MenuItem, type UIElement } from "@ui";
import { Icons } from "../icons.js";
import {
  toolbarRef,
  useIsMobile,
  usePopupManager,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import { Button } from "../../components/button.js";
import { MenuPresenter } from "../../components/menu/index.js";

type DropdownProps = {
  id: string;
  group: string;
  selectedItem: string | JSX.Element;
  items: MenuItem[];
  buttonRef?: React.MutableRefObject<UIElement | null>;
  menuWidth?: number;
  disabled?: boolean;
};
export function Dropdown(props: DropdownProps) {
  const { id, group, items, selectedItem, buttonRef, menuWidth, disabled } =
    props;
  const internalRef = useRef<UIElement | null>(null);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();
  const isBottom = toolbarLocation === "bottom";
  const { isOpen, toggle, close } = usePopupManager({ group, id });

  return (
    <>
      <Button
        variant="secondary"
        testID={`dropdown-${id}`}
        ref={(ref) => {
          internalRef.current = ref;
          if (buttonRef) buttonRef.current = ref;
        }}
        sx={{
          p: 1,
          m: 0,
          mr: 1,
          bg: isOpen ? "hover" : "transparent",
          height: "100%",
          flexShrink: 0,
          flexDirection: "row",
          alignItems: "center",
          ...(isMobile ? { ":hover": { bg: "transparent" } } : {})
        }}
        disabled={disabled}
        onClick={toggle}
      >
        {typeof selectedItem === "string" ? (
          <Text
            sx={{
              fontSize: "subBody",
              mr: 1,
              color: isOpen ? "accent" : "paragraph",
              flexShrink: 0
            }}
          >
            {selectedItem}
          </Text>
        ) : (
          selectedItem
        )}
        <Icon
          path={
            isBottom
              ? isOpen
                ? Icons.chevronDown
                : Icons.chevronUp
              : isOpen
              ? Icons.chevronUp
              : Icons.chevronDown
          }
          color={isOpen ? "accent" : "paragraph"}
          size="small"
        />
      </Button>

      <MenuPresenter
        isOpen={isOpen}
        items={items}
        onClose={close}
        anchorRef={isBottom ? toolbarRef : internalRef}
        placement={isBottom ? "top-start" : "bottom-start"}
        sx={{
          minWidth: menuWidth,
          flexDirection: isBottom ? "row" : "column",
          alignItems: isBottom ? "center" : undefined
        }}
      />
    </>
  );
}
