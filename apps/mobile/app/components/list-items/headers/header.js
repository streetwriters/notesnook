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

import React from "react";
import { View } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import { useMessageStore } from "../../../stores/use-message-store";
import { COLORS_NOTE } from "../../../utils/color-scheme";
import { Announcement } from "../../announcements/announcement";
import { Card } from "../../list/card";
import Paragraph from "../../ui/typography/paragraph";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SIZE } from "../../../utils/size";
import { useSelectionStore } from "../../../stores/use-selection-store";
export const Header = React.memo(
  ({
    type,
    messageCard = true,
    color,
    shouldShow = false,
    noAnnouncement,
    warning
  }) => {
    const colors = useThemeColors();
    const announcements = useMessageStore((state) => state.announcements);
    const selectionMode = useSelectionStore((state) => state.selectionMode);

    return selectionMode ? null : (
      <>
        {warning ? (
          <View
            style={{
              padding: 12,
              backgroundColor: colors.errorBg,
              width: "95%",
              alignSelf: "center",
              borderRadius: 5,
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            <Icon name="sync-alert" size={SIZE.md} color={colors.error.icon} f />
            <Paragraph style={{ marginLeft: 5 }} color={colors.error.icon}>
              {warning.title}
            </Paragraph>
          </View>
        ) : announcements.length !== 0 && !noAnnouncement ? (
          <Announcement color={color || colors.primary.accent} />
        ) : type === "search" ? null : !shouldShow ? (
          <View
            style={{
              marginBottom: 5,
              padding: 0,
              width: "100%",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {messageCard ? (
              <Card
                color={COLORS_NOTE[color?.toLowerCase()] || colors.primary.accent}
              />
            ) : null}
          </View>
        ) : null}
      </>
    );
  }
);

Header.displayName = "Header";
