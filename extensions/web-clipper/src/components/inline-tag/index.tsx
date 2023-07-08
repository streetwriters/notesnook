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

import { Flex, Text } from "@theme-ui/components";
import { Icon } from "../icons/icon";
import { SchemeColors } from "@notesnook/theme/dist/theme/colorscheme";
import { EmotionThemeVariant } from "@notesnook/theme";

export function InlineTag(props: {
  title: string;
  icon: string;
  iconColor?: keyof SchemeColors;
  onClick: () => void;
}) {
  const { title, icon, onClick, iconColor = "icon" } = props;

  return (
    <EmotionThemeVariant variant="secondary">
      <Flex
        onClick={onClick}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          bg: "bgSecondary",
          border: "1px solid var(--border)",
          borderRadius: "small",
          p: "3px",
          pr: 1,
          cursor: "pointer",
          ":hover": {
            bg: "hover"
          }
        }}
      >
        <Icon path={icon} color={iconColor} size={14} />
        <Text variant="subBody" sx={{ color: "icon", ml: 1 }}>
          {title}
        </Text>
      </Flex>
    </EmotionThemeVariant>
  );
}
