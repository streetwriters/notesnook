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
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { eCloseSheet } from "../../../utils/events";
import { SideMenuItem } from "../../../utils/menu-items";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { useSideBarDraggingStore } from "../../side-menu/dragging-store";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
export const MenuItemProperties = ({ item }: { item: SideMenuItem }) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {[
        {
          title: strings.setAsHomepage(),
          onPress: () => {
            SettingsService.setProperty("homepageV2", {
              id: item.id,
              type: "default"
            });
            eSendEvent(eCloseSheet);
          },
          icon: "home-outline"
        },
        {
          title: strings.reorder(),
          onPress: () => {
            useSideBarDraggingStore.setState({
              dragging: true
            });
            eSendEvent(eCloseSheet);
          },
          icon: "sort-ascending"
        }
      ].map((item) => (
        <Pressable
          key={item.title}
          style={{
            paddingVertical: DefaultAppStyles.GAP_VERTICAL,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "flex-start",
            gap: DefaultAppStyles.GAP_SMALL,
            borderRadius: 0,
            paddingHorizontal: DefaultAppStyles.GAP
          }}
          onPress={() => {
            item.onPress();
          }}
        >
          <AppIcon
            color={colors.secondary.icon}
            name={item.icon}
            size={AppFontSize.xl}
          />
          <Paragraph>{item.title}</Paragraph>
        </Pressable>
      ))}
    </View>
  );
};

MenuItemProperties.present = (item: SideMenuItem) => {
  presentSheet({
    component: <MenuItemProperties item={item} />
  });
};
