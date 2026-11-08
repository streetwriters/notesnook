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

import type { MenuItem } from "@ui";
import { Box, Button, Flex, Text, ThemeScope } from "@ui";
import { Check } from "../icons";
import { useMenuStore } from "./store";

export { useMenuStore } from "./store";

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

function MenuButton(props: {
  item: Extract<MenuItem, { type: "button" }>;
  onClose: () => void;
}) {
  const { item } = props;
  const dangerous = item.variant === "dangerous";
  const IconComponent = item.iconComponent;
  return (
    <Button
      testID={`menu-button-${item.key}`}
      variant="menuitem"
      disabled={item.isDisabled}
      onPress={() => {
        item.onClick?.();
        props.onClose();
      }}
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        px: "spacing4",
        py: "spacing3",
        minHeight: 29
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
      {item.isChecked ? (
        <Flex
          testID="toggle-state-on"
          sx={{ ml: 4, flexShrink: 0, flexDirection: "row", gap: 1 }}
        >
          <Check
            size={13}
            color={dangerous ? "icon-error" : "icon-secondary"}
          />
        </Flex>
      ) : null}
    </Button>
  );
}

export function MenuHost() {
  const items = useMenuStore((store) => store.items);
  const anchor = useMenuStore((store) => store.anchor);
  const title = useMenuStore((store) => store.title);
  const close = useMenuStore((store) => store.close);
  if (!items || !anchor) return null;

  return (
    <ThemeScope scope="contextMenu">
      <Box
        testID="menu-backdrop"
        onPress={close}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <Flex
          testID="menu-container"
          onPress={(event) => event.stopPropagation()}
          sx={{
            position: "absolute",
            top: anchor.y + anchor.height + 5,
            left: anchor.x,
            bg: "background",
            flexDirection: "column",
            borderRadius: "radius2",
            boxShadow: "menu",
            border: "1px solid",
            borderColor: "border-secondary",
            minWidth: 220,
            py: "spacing4"
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
          {items.map((item) => {
            if (item.isHidden) return null;
            if (item.type === "separator") return <Separator key={item.key} />;
            if (item.type === "button")
              return <MenuButton key={item.key} item={item} onClose={close} />;
            if (item.type === "popup") {
              const Popup = item.component;
              return <Popup key={item.key} onClick={close} />;
            }
            return null;
          })}
        </Flex>
      </Box>
    </ThemeScope>
  );
}
