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

import { useRef, useState } from "react";
import { Text } from "@theme-ui/components";
import { Icon } from "./icon";
import { Icons } from "../icons";
// import { MenuPresenter, MenuPresenterProps } from "../../components/menu/menu";
import { MenuItem } from "../../components/menu/types";
import { useIsMobile, useToolbarLocation } from "../stores/toolbar-store";
import { MenuPresenter } from "../../components/menu";
import { getToolbarElement } from "../utils/dom";
import { Button } from "../../components/button";
import { usePopupHandler } from "../../components/popup-presenter";

type DropdownProps = {
  id: string;
  group: string;
  selectedItem: string | JSX.Element;
  items: MenuItem[];
  buttonRef?: React.MutableRefObject<HTMLButtonElement | undefined>;
  menuWidth?: number;
};
export function Dropdown(props: DropdownProps) {
  const { id, group, items, selectedItem, buttonRef, menuWidth } = props;
  const internalRef = useRef<HTMLButtonElement>();
  const [isOpen, setIsOpen] = useState(false);
  const toolbarLocation = useToolbarLocation();
  const isMobile = useIsMobile();
  const isBottom = toolbarLocation === "bottom";

  const { isPopupOpen } = usePopupHandler({
    group,
    id,
    isOpen,
    onClosed: () => setIsOpen(false)
  });

  return (
    <>
      <Button
        ref={(ref) => {
          internalRef.current = ref || undefined;
          if (buttonRef) buttonRef.current = ref || undefined;
        }}
        sx={{
          p: 1,
          m: 0,
          bg: isPopupOpen ? "hover" : "transparent",
          mr: 1,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          ":hover": { bg: "hover" },
          ":last-of-type": {
            mr: 0
          }
        }}
        onClick={() => setIsOpen((s) => !s)}
        onMouseDown={(e) => e.preventDefault()}
      >
        {typeof selectedItem === "string" ? (
          <Text
            sx={{
              fontSize: "subBody",
              mr: 1,
              color: "paragraph",
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
              ? isPopupOpen
                ? Icons.chevronDown
                : Icons.chevronUp
              : isPopupOpen
              ? Icons.chevronUp
              : Icons.chevronDown
          }
          size={"small"}
        />
      </Button>

      <MenuPresenter
        isOpen={isPopupOpen}
        items={items}
        onClose={() => setIsOpen(false)}
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
