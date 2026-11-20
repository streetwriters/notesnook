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

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  formatShortcut,
  Icon,
  Popover,
  Text,
  type AnchorRect,
  type MenuButtonItem,
  type MenuItem,
  type PopoverPlacement,
  type SxProp,
  type UIElement
} from "@ui";
import { Icons } from "../../toolbar/icons.js";

export type { MenuItem, MenuButtonItem };

export type MenuPresenterProps = {
  isOpen: boolean;
  items: MenuItem[];
  onClose: () => void;
  anchorRef?: React.RefObject<UIElement | null>;
  anchorRect?: AnchorRect;
  placement?: PopoverPlacement;
  sx?: SxProp;
};

export function MenuPresenter(props: MenuPresenterProps) {
  const { isOpen, items, onClose, anchorRef, anchorRect, placement, sx } =
    props;
  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      anchorRef={anchorRef}
      anchorRect={anchorRect}
      placement={placement}
      sx={{ flexDirection: "column", py: 1, ...sx }}
    >
      <MenuItems items={items} onClose={onClose} />
    </Popover>
  );
}

export function MenuItems(props: { items: MenuItem[]; onClose: () => void }) {
  const { items, onClose } = props;
  const [openSubmenu, setOpenSubmenu] = useState<string>();
  return (
    <>
      {items.map((item) => {
        if (item.isHidden) return null;
        switch (item.type) {
          case "separator":
            return <MenuSeparator key={item.key} />;
          case "popup": {
            const Component = item.component;
            return <Component key={item.key} onClick={onClose} />;
          }
          case "lazy-loader":
            return (
              <LazyMenuItems
                key={item.key}
                loader={item.items}
                onClose={onClose}
              />
            );
          case "button":
            return (
              <MenuButton
                key={item.key}
                item={item}
                onClose={onClose}
                isSubmenuOpen={openSubmenu === item.key}
                onToggleSubmenu={() =>
                  setOpenSubmenu((key) =>
                    key === item.key ? undefined : item.key
                  )
                }
              />
            );
        }
      })}
    </>
  );
}

export function MenuSeparator() {
  return (
    <Box
      sx={{
        width: "95%",
        height: "1px",
        bg: "separator",
        my: 1,
        alignSelf: "center"
      }}
    />
  );
}

export function MenuButton(props: {
  item: MenuButtonItem;
  onClose: () => void;
  isSubmenuOpen?: boolean;
  onToggleSubmenu?: () => void;
}) {
  const { item, onClose, isSubmenuOpen, onToggleSubmenu } = props;
  const ref = useRef<UIElement>(null);
  const IconComponent = item.iconComponent;
  const submenu = item.menu;
  return (
    <>
      <Button
        ref={ref}
        testID={`menu-button-${item.key}`}
        variant="menuitem"
        focusable={false}
        title={item.tooltip || item.title}
        disabled={item.isDisabled}
        onPress={() => {
          if (submenu) {
            onToggleSubmenu?.();
            return;
          }
          item.onClick?.();
          onClose();
        }}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          bg: isSubmenuOpen || item.isChecked ? "hover" : undefined
        }}
      >
        <Flex sx={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          {IconComponent ? (
            <IconComponent size="medium" color="icon" />
          ) : item.icon ? (
            <Icon path={item.icon} size="medium" color="icon" />
          ) : null}
          <Text
            numberOfLines={1}
            sx={{
              fontSize: "body",
              color: item.variant === "dangerous" ? "paragraph-error" : "paragraph"
            }}
          >
            {item.title}
          </Text>
        </Flex>
        {item.isChecked || submenu || item.modifier ? (
          <Flex
            sx={{
              flexDirection: "row",
              alignItems: "center",
              gap: 1,
              ml: 4,
              flexShrink: 0
            }}
          >
            {item.modifier && formatShortcut(item.modifier) ? (
              <Text sx={{ fontSize: "subBody", color: "paragraph-secondary" }}>
                {formatShortcut(item.modifier)}
              </Text>
            ) : null}
            {item.isChecked ? (
              <Icon path={Icons.check} size="small" color="icon" />
            ) : null}
            {submenu ? (
              <Icon path={Icons.chevronRight} size="small" color="icon" />
            ) : null}
          </Flex>
        ) : null}
      </Button>
      {submenu ? (
        <MenuPresenter
          isOpen={!!isSubmenuOpen}
          items={submenu.items}
          onClose={onClose}
          anchorRef={ref}
          placement="right-start"
        />
      ) : null}
    </>
  );
}

function LazyMenuItems(props: {
  loader: () => Promise<MenuItem[]>;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MenuItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    props.loader().then((loaded) => {
      if (!cancelled) setItems(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [props.loader]);
  return <MenuItems items={items} onClose={props.onClose} />;
}
