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

import { mdiCheck, mdiChevronRight, mdiCrown } from "@mdi/js";
import { useEffect, useRef, useState } from "react";
import { environment, keyboard } from "@platform";
import type * as Contract from "../contracts/overlays";
import type { UIElement } from "../contracts/elements";
import type { ColorValue, SxProp } from "../contracts/style";
import { mdiIcon } from "../shared/icon-factory";
import { dataColor } from "../shared/style/data-color";
import { measureInWindow } from "./element";
import { useWindowSize } from "./hooks";
import { ScrollContainer } from "./layout";
import { PopupPresenter } from "./popover";
import { Box, Button, Flex, Icon, Text } from "./primitives";

// The menu apps/web draws with `MenuPresenter` from `@notesnook/ui`: the same
// items, submenus, lazy items and keyboard navigation, on the native kit.

type MenuItem = Contract.MenuItem;

const CaretRight = mdiIcon(mdiChevronRight);
const Check = mdiIcon(mdiCheck);
const Pro = mdiIcon(mdiCrown);

type MenuButtonItem = Extract<MenuItem, { type: "button" }>;

function Separator() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "1px",
        bg: "separator",
        my: "spacing3",
        alignSelf: "center"
      }}
    />
  );
}

function translateModifier(modifier: string) {
  const os = environment.os;
  if (os === "Android" || os === "iOS") return "";
  const isMacOS = os === "macOS";
  return modifier
    .split("-")
    .map((p) => {
      if (isMacOS)
        return p === "Mod"
          ? "\u2318"
          : p === "Alt"
          ? "\u2325"
          : p === "Shift"
          ? "\u21E7"
          : p;
      return p === "Mod" ? "Ctrl" : p;
    })
    .join(isMacOS ? "" : "+");
}

function MenuButton(props: {
  item: MenuButtonItem;
  onClose: () => void;
  isFocused?: boolean;
  isSubmenuOpen?: boolean;
  onHover?: () => void;
  onOpenSubmenu?: () => void;
}) {
  const { item } = props;
  const dangerous = item.variant === "dangerous";
  const IconComponent = item.iconComponent;
  const iconColor = (item.styles?.icon?.color ??
    (dangerous ? "icon-error" : "icon-secondary")) as ColorValue;
  const hasSubmenu = !!item.menu;
  return (
    <Button
      data-test-id={`menu-button-${item.key}`}
      variant="menuitem"
      title={item.tooltip || item.title}
      disabled={item.isDisabled}
      onMouseEnter={props.onHover}
      onClick={() => {
        if (hasSubmenu) {
          props.onOpenSubmenu?.();
          return;
        }
        item.onClick?.();
        props.onClose();
      }}
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        px: "spacing4",
        py: "spacing3",
        minHeight: 29,
        bg:
          props.isFocused || props.isSubmenuOpen
            ? "background-selected"
            : undefined
      }}
    >
      <Flex
        sx={{
          flexDirection: "row",
          minWidth: 0,
          overflow: "hidden",
          alignItems: "center",
          gap: "spacing3"
        }}
      >
        {IconComponent ? (
          <IconComponent size={13} color={iconColor} />
        ) : item.icon ? (
          <Icon path={item.icon} size={13} color={iconColor} />
        ) : null}
        <Text
          variant="body"
          sx={{
            lineClamp: 1,
            color: dangerous ? "paragraph-error" : "paragraph",
            fontSize: "xxs",
            fontWeight: 400,
            lineHeight: 1,
            minWidth: 0
          }}
        >
          {item.title}
        </Text>
      </Flex>
      {item.isChecked || hasSubmenu || item.modifier || item.premium ? (
        <Flex
          data-test-id={`toggle-state-${item.isChecked ? "on" : "off"}`}
          sx={{
            ml: 4,
            flexShrink: 0,
            flexDirection: "row",
            alignItems: "center",
            gap: 1
          }}
        >
          {item.premium ? <Pro size={13} color={dataColor("#D7C131")} /> : null}
          {item.modifier ? (
            <Text
              sx={{
                fontFamily: "body",
                fontSize: "subBody",
                color: "paragraph-secondary",
                mr: item.isChecked || hasSubmenu ? 1 : 19
              }}
            >
              {translateModifier(item.modifier)}
            </Text>
          ) : null}
          {item.isChecked ? (
            <Check
              size={13}
              color={dangerous ? "icon-error" : "icon-secondary"}
            />
          ) : null}
          {hasSubmenu ? (
            <CaretRight
              size={13}
              color={dangerous ? "icon-error" : "icon-secondary"}
            />
          ) : null}
        </Flex>
      ) : null}
    </Button>
  );
}

function LazyItems(props: {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <MenuItems items={items} onClose={props.onClose} />;
}

function MenuPanel(props: {
  items: MenuItem[];
  title?: string;
  onClose: () => void;
  onSize?: (size: { width: number; height: number }) => void;
  onLeave?: () => void;
  maxHeight?: number;
  sx?: SxProp;
}) {
  const { title, items, onClose, onSize } = props;
  const scrollable =
    props.maxHeight !== undefined &&
    !items.some((item) => item.type === "button" && !!item.menu);
  const list = (
    <MenuItems
      items={items}
      onClose={onClose}
      navigation
      onLeave={props.onLeave}
    />
  );
  const element = useRef<UIElement>(null);
  useEffect(() => {
    if (!onSize) return;
    const frame = setTimeout(
      () =>
        measureInWindow(element.current, (_x, _y, width, height) =>
          onSize({ width, height })
        ),
      0
    );
    return () => clearTimeout(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  return (
    <Flex
      ref={element}
      data-test-id="menu-container"
      onClick={(event) => event.stopPropagation()}
      sx={{
        bg: "background",
        flexDirection: "column",
        borderRadius: "radius2",
        boxShadow: "menu",
        border: "1px solid",
        borderColor: "border-secondary",
        minWidth: 220,
        maxWidth: 350,
        py: "spacing4",
        ...props.sx
      }}
    >
      {title ? (
        <>
          <Text
            data-test-id="menu-title"
            sx={{
              color: "accent",
              fontSize: "xxs",
              py: "spacing1",
              px: "spacing4"
            }}
          >
            {title}
          </Text>
          <Separator />
        </>
      ) : null}
      {scrollable ? (
        <ScrollContainer sx={{ maxHeight: (props.maxHeight ?? 0) - 40 }}>
          {list}
        </ScrollContainer>
      ) : (
        list
      )}
    </Flex>
  );
}

type MenuNavigator = { handle: (key: string) => boolean };
const navigators: MenuNavigator[] = [];
let detachKeys: (() => void) | undefined;

const NAVIGATION_KEYS = ["up", "down", "left", "right", "home", "end", "enter"];

function attachKeys() {
  if (detachKeys) return;
  detachKeys = keyboard.register(
    NAVIGATION_KEYS,
    (event) => {
      const top = navigators[navigators.length - 1];
      if (!top) return;
      if (top.handle(event.key)) event.preventDefault();
    },
    { allowInTextInput: true }
  );
}

function MenuItems(props: {
  items: MenuItem[];
  onClose: () => void;
  navigation?: boolean;
  onLeave?: () => void;
}) {
  const { items, onClose } = props;
  const [openKey, setOpenKey] = useState<string>();
  const [focusKey, setFocusKeyState] = useState<string>();
  const focusRef = useRef<string | undefined>(undefined);
  const setFocusKey = (key: string | undefined) => {
    focusRef.current = key;
    setFocusKeyState(key);
  };
  const navigable = items.filter(
    (item): item is MenuButtonItem =>
      item.type === "button" && !item.isHidden && !item.isDisabled
  );
  const move = (to: number) => {
    const target = navigable[(to + navigable.length) % navigable.length];
    if (!target) return;
    setFocusKey(target.key);
    setOpenKey(undefined);
  };
  const handle = (key: string) => {
    const index = navigable.findIndex((item) => item.key === focusRef.current);
    const focused = navigable[index];
    switch (key) {
      case "down":
        move(index < 0 ? 0 : index + 1);
        return true;
      case "up":
        move(index < 0 ? navigable.length - 1 : index - 1);
        return true;
      case "home":
        move(0);
        return true;
      case "end":
        move(navigable.length - 1);
        return true;
      case "right":
        if (!focused?.menu) return false;
        setOpenKey(focused.key);
        return true;
      case "left":
        if (!props.onLeave) return false;
        props.onLeave();
        return true;
      case "enter":
        if (!focused) return false;
        if (focused.menu) setOpenKey(focused.key);
        else {
          focused.onClick?.();
          onClose();
        }
        return true;
      default:
        return false;
    }
  };
  const handleRef = useRef(handle);
  handleRef.current = handle;
  useEffect(() => {
    if (!props.navigation) return;
    const navigator: MenuNavigator = {
      handle: (key) => handleRef.current(key)
    };
    navigators.push(navigator);
    attachKeys();
    return () => {
      const index = navigators.indexOf(navigator);
      if (index >= 0) navigators.splice(index, 1);
      if (navigators.length === 0) {
        detachKeys?.();
        detachKeys = undefined;
      }
    };
  }, [props.navigation]);
  return (
    <>
      {environment.isDev && focusKey ? (
        <Box
          data-test-id={`menu-cursor-${focusKey}`}
          sx={{ position: "absolute", width: 0, height: 0 }}
        />
      ) : null}
      {items.map((item) => {
        if (item.isHidden) return null;
        if (item.type === "separator") return <Separator key={item.key} />;
        if (item.type === "lazy-loader")
          return (
            <LazyItems key={item.key} loader={item.items} onClose={onClose} />
          );
        if (item.type === "popup") {
          const Popup = item.component;
          return <Popup key={item.key} onClick={onClose} />;
        }
        const isOpen = openKey === item.key && !!item.menu;
        return (
          <Box key={item.key} sx={{ position: "relative" }}>
            <MenuButton
              item={item}
              onClose={onClose}
              isSubmenuOpen={isOpen}
              isFocused={focusKey === item.key}
              onHover={() => {
                setFocusKey(item.isDisabled ? undefined : item.key);
                setOpenKey(item.menu ? item.key : undefined);
              }}
              onOpenSubmenu={() => setOpenKey(item.key)}
            />
            {isOpen && item.menu ? (
              <MenuPanel
                items={item.menu.items}
                title={item.menu.title}
                onClose={onClose}
                onLeave={() => setOpenKey(undefined)}
                sx={{
                  position: "absolute",
                  left: "100%",
                  top: 0,
                  zIndex: 1001
                }}
              />
            ) : null}
          </Box>
        );
      })}
    </>
  );
}

/** The menu's panel: its title and items, without a popup around it. */
export function Menu(props: {
  items: MenuItem[];
  title?: string;
  onClose: () => void;
  sx?: SxProp;
}) {
  const viewport = useWindowSize();
  return (
    <MenuPanel
      items={props.items}
      title={props.title}
      onClose={props.onClose}
      maxHeight={viewport.height * 0.8}
      sx={props.sx}
    />
  );
}

export function MenuPresenter(props: Contract.MenuPresenterProps) {
  const { items = [], title, children, ...popup } = props;
  if (!props.isOpen) return null;
  return (
    <PopupPresenter scope="contextMenu" {...popup}>
      {children ? (
        children
      ) : (
        <Menu items={items} title={title} onClose={props.onClose} />
      )}
    </PopupPresenter>
  );
}
