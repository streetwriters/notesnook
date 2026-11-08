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

import { strings } from "@notesnook/intl";
import { dataColor, Flex, Text, type ColorValue } from "@ui";
import { Circle, Notebook, Notes, Plus, StarOutline, Tag } from "../icons";

type PreviewColors = {
  accent: string;
  paragraph: string;
  background: string;
  border: string;
  editor: string;
  navigationMenu: { background: string; accent: string; icon: string };
  list: {
    background: string;
    heading: string;
    accent: string;
    accentForeground: string;
  };
  statusBar: { background: string; icon: string; paragraph: string };
};

export type ThemePreviewProps = {
  theme: { previewColors: PreviewColors };
};

function color(value: string, alpha = ""): ColorValue {
  return /^#[0-9a-f]{6}$/i.test(value)
    ? dataColor(value + alpha)
    : "background-secondary";
}

export function ThemePreview(props: ThemePreviewProps) {
  const colors = props.theme.previewColors;

  return (
    <Flex
      testID="theme-preview"
      sx={{
        position: "relative",
        flexDirection: "column",
        height: 200,
        borderRadius: "default",
        overflow: "hidden",
        bg: color(colors.accent, "33"),
        border: "2px solid",
        borderColor: color(colors.accent)
      }}
    >
      <Flex
        sx={{
          flexDirection: "row",
          borderRadius: "default",
          p: "small",
          position: "absolute",
          bottom: 1,
          right: 1,
          zIndex: 1
        }}
      >
        {[colors.accent, colors.paragraph, colors.background].map((value) => (
          <Circle key={value} color={color(value)} size={18} sx={{ ml: -12 }} />
        ))}
      </Flex>
      <Flex sx={{ flexDirection: "row", flex: 1 }}>
        <Flex
          sx={{
            bg: color(colors.navigationMenu.background),
            width: 20,
            flexDirection: "column",
            gap: 2,
            py: 1,
            borderRight: "1px solid",
            borderRightColor: color(colors.border)
          }}
        >
          {[Notes, Notebook, StarOutline, Tag].map((IconComponent, index) => (
            <IconComponent
              key={index.toString()}
              color={color(
                index === 0
                  ? colors.navigationMenu.accent
                  : colors.navigationMenu.icon
              )}
              size={8}
            />
          ))}
        </Flex>
        <Flex
          sx={{
            flexDirection: "row",
            bg: color(colors.list.background),
            flex: 0.3,
            p: 1,
            borderRight: "1px solid",
            borderRightColor: color(colors.border)
          }}
        >
          <Flex
            sx={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: 120
            }}
          >
            <Text
              variant="heading"
              sx={{ color: color(colors.list.heading), fontSize: 7 }}
            >
              {strings.dataTypesPluralCamelCase.note()}
            </Text>
            <Plus
              color={color(colors.list.accentForeground)}
              size={8}
              sx={{
                bg: color(colors.list.accent),
                width: 10,
                height: 10,
                borderRadius: 100
              }}
            />
          </Flex>
        </Flex>
        <Flex sx={{ bg: color(colors.editor), flex: 1 }} />
      </Flex>
      <Flex
        sx={{
          flexDirection: "row",
          height: 10,
          bg: color(colors.statusBar.background),
          px: 1,
          alignItems: "center",
          gap: 1,
          borderTop: "1px solid",
          borderTopColor: color(colors.border)
        }}
      >
        <Circle color={color(colors.statusBar.icon)} size={3} />
        <Text
          variant="subBody"
          sx={{ fontSize: 5, color: color(colors.statusBar.paragraph) }}
        >
          johndoe@email.com
        </Text>
      </Flex>
    </Flex>
  );
}
