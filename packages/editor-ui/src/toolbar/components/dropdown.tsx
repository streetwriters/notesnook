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
import { Text } from "@theme-ui/components";
import { Icon, MenuItem, MenuPresenter } from "@notesnook/ui";
import { Icons } from "../icons.js";
import {
  useIsMobile,
  usePopupManager,
  useToolbarLocation
} from "../stores/toolbar-store.js";
import { getToolbarElement } from "../utils/dom.js";
import { Button } from "../../components/button.js";

type DropdownProps = {
  id: string;
  group: string;
  selectedItem: string | JSX.Element;
  items: MenuItem[];
  buttonRef?: React.MutableRefObject<HTMLButtonElement | undefined>;
  menuWidth?: number;
  disabled?: boolean;
};
export function Dropdown(props: DropdownProps) {
  const { id, group, items, selectedItem, buttonRef, menuWidth, disabled } =
    props;
  const internalRef = useRef<HTMLButtonElement>();
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();
  const isBottom = toolbarLocation === "bottom";
  const { isOpen, toggle, close } = usePopupManager({ group, id });

  return (
    <>
      <Button
        variant="secondary"
        ref={(ref) => {
          internalRef.current = ref || undefined;
          if (buttonRef) buttonRef.current = ref || undefined;
        }}
        sx={{
          p: 1,
          m: 0,
          bg: isOpen ? "hover" : "transparent",
          height: "100%",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          ":last-of-type": {
            mr: 0
          },
          ":hover:not(:disabled):not(:active)": !isMobile
            ? undefined
            : {
                bg: "transparent"
              }
        }}
        disabled={disabled}
        onClick={toggle}
        onMouseDown={(e) => e.preventDefault()}
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
          size={"small"}
        />
      </Button>

      <MenuPresenter
        isOpen={isOpen}
        items={items}
        onClose={close}
        position={{
          target: isBottom
            ? getToolbarElement()
            : internalRef.current || "mouse",
          isTargetAbsolute: true,
          location: isBottom ? "top" : "below",
          align: "center",
          yOffset: 5
        }}
        blocking={!isMobile}
        focusOnRender={!isMobile}
        onMouseDown={(e) => {
          if (globalThis.keyboardShown) {
            e.preventDefault();
          }
        }}
        sx={{
          minWidth: menuWidth,
          maxWidth: isBottom ? "95vw" : "auto",
          flexDirection: isBottom ? "row" : "column",
          overflowX: isBottom ? "auto" : "hidden",
          marginRight: isBottom ? "10px" : 0,
          display: "flex",
          alignItems: isBottom ? "center" : "unset",
          mr: isBottom ? 0 : 2
        }}
      />
    </>
  );
}
