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
import type { MenuItem, SxProp, UIElement } from "@ui";
import {
  Box,
  Button,
  dataColor,
  Flex,
  Icon,
  Text,
  ThemeScope,
  useWindowSize
} from "@ui";
import { CaretRight, Check, Pro } from "../icons";
import { environment } from "@platform";
import { useMenuStore } from "./store";
import { useEscape } from "../../hooks/use-escape";

export { useMenuStore } from "./store";

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
  const hasSubmenu = !!item.menu;
  return (
    <Button
      testID={`menu-button-${item.key}`}
      variant="menuitem"
      title={item.tooltip || item.title}
      disabled={item.isDisabled}
      onHoverIn={props.onHover}
      onPress={() => {
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
          <IconComponent
            size={13}
            color={dangerous ? "icon-error" : "icon-secondary"}
          />
        ) : item.icon ? (
          <Icon
            path={item.icon}
            size={13}
            color={dangerous ? "icon-error" : "icon-secondary"}
          />
        ) : null}
        <Text
          variant="body"
          numberOfLines={1}
          sx={{
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
          testID={`toggle-state-${item.isChecked ? "on" : "off"}`}
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
  sx?: SxProp;
}) {
  const { title, items, onClose, onSize } = props;
  const element = useRef<UIElement>(null);
  useEffect(() => {
    if (!onSize) return;
    const frame = setTimeout(
      () =>
        element.current?.measureInWindow((_x, _y, width, height) =>
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
      testID="menu-container"
      onPress={(event) => event.stopPropagation()}
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
            testID="menu-title"
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
      <MenuItems items={items} onClose={onClose} />
    </Flex>
  );
}

function MenuItems(props: { items: MenuItem[]; onClose: () => void }) {
  const { items, onClose } = props;
  const [openKey, setOpenKey] = useState<string>();
  const [focusKey, setFocusKey] = useState<string>();
  return (
    <>
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

export function MenuHost() {
  const items = useMenuStore((store) => store.items);
  const anchor = useMenuStore((store) => store.anchor);
  const title = useMenuStore((store) => store.title);
  const close = useMenuStore((store) => store.close);
  const viewport = useWindowSize();
  const [size, setSize] = useState<{ width: number; height: number }>();
  useEscape(close, !!items && !!anchor);
  useEffect(() => {
    if (!items) setSize(undefined);
  }, [items]);
  if (!items || !anchor) return null;
  const margin = 8;
  const top = Math.max(
    margin,
    Math.min(
      anchor.y + anchor.height + 5,
      viewport.height - (size?.height ?? 0) - margin
    )
  );
  const left = Math.max(
    margin,
    Math.min(anchor.x, viewport.width - (size?.width ?? 0) - margin)
  );

  return (
    <ThemeScope scope="contextMenu">
      <Box
        testID="menu-backdrop"
        onPress={close}
        onContextMenu={(event) => {
          event.preventDefault();
          close();
        }}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000
        }}
      >
        <MenuPanel
          items={items}
          title={title}
          onClose={close}
          onSize={setSize}
          sx={{
            position: "absolute",
            top,
            left
          }}
        />
      </Box>
    </ThemeScope>
  );
}
