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

import { alpha } from "@theme-ui/color";
import { Flex, Text } from "@theme-ui/components";
import { Circle, Notes, Notebook, StarOutline, Tag, Plus } from "../icons";
import { ThemeMetadata } from "@notesnook/themes-server";
import { strings } from "@notesnook/intl";

export type ThemePreviewProps = {
  theme: ThemeMetadata;
};

export function ThemePreview(props: ThemePreviewProps) {
  const { theme } = props;

  return (
    <Flex
      sx={{
        position: "relative",
        flexDirection: "column",
        height: 200,
        borderRadius: "default",
        overflow: "hidden",
        bg: alpha(theme.previewColors.accent, 0.2),
        //m: 2,

        border: `2px solid ${theme.previewColors.accent}`,
        gap: 0,
        transition: "all 300ms ease-out",
        ":hover": {
          gap: 1,
          p: 1,
          "&> div.ui": { gap: 1 },
          "& *": { border: "none" }
        }
      }}
    >
      <Flex
        sx={{
          borderRadius: "default",
          p: "small",
          position: "absolute",
          bottom: 1,
          right: 1
        }}
      >
        {[
          theme.previewColors.accent,
          theme.previewColors.paragraph,
          theme.previewColors.background
        ].map((color) => (
          <Circle
            key={color}
            color={color}
            size={18}
            sx={{
              ml: -12
            }}
          />
        ))}
      </Flex>
      <Flex
        className="ui"
        sx={{ flex: 1, gap: 0, transition: "all 300ms ease-out" }}
      >
        <Flex
          className="navigation"
          sx={{
            bg: theme.previewColors.navigationMenu.background,
            width: 20,
            flexDirection: "column",
            gap: 2,
            py: 1,
            borderRight: `1px solid ${theme.previewColors.border}`
          }}
        >
          {[Notes, Notebook, StarOutline, Tag].map((Icon, index) => (
            <Icon
              key={index.toString()}
              color={
                index === 0
                  ? theme.previewColors.navigationMenu.accent
                  : theme.previewColors.navigationMenu.icon
              }
              size={8}
            />
          ))}
        </Flex>
        <Flex
          className="list"
          sx={{
            bg: theme.previewColors.list.background,
            flex: 0.3,
            p: 1,
            borderRight: `1px solid ${theme.previewColors.border}`
          }}
        >
          <Flex
            sx={{
              justifyContent: "space-between",
              width: 120
            }}
          >
            <Text
              variant="heading"
              sx={{
                color: theme.previewColors.list.heading,
                fontSize: 7
              }}
            >
              {strings.dataTypesPluralCamelCase.note()}
            </Text>
            <Plus
              color={theme.previewColors.list.accentForeground}
              size={8}
              sx={{
                bg: theme.previewColors.list.accent,
                size: 10,
                borderRadius: 100
              }}
            />
          </Flex>
        </Flex>
        <Flex
          className="editor"
          sx={{ bg: theme.previewColors.editor, flex: 1 }}
        />
      </Flex>
      <Flex
        className="statusbar"
        sx={{
          height: 10,
          bg: theme.previewColors.statusBar.background,
          px: 1,
          alignItems: "center",
          gap: 1,
          borderTop: `1px solid ${theme.previewColors.border}`
        }}
      >
        <Circle color={theme.previewColors.statusBar.icon} size={3} />
        <Text
          variant="subBody"
          sx={{
            fontSize: 5,
            color: theme.previewColors.statusBar.paragraph
          }}
        >
          johndoe@email.com
        </Text>
      </Flex>
    </Flex>
  );
}
