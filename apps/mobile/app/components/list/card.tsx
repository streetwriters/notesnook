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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { Dimensions, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Radius, Spacing } from "../../common/design/spacing";
import { Message, useMessageStore } from "../../stores/use-message-store";
import AppIcon from "../ui/AppIcon";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const Card = ({
  color,
  customMessage
}: {
  color?: string;
  customMessage?: Omit<Message, "data">;
}) => {
  const { colors } = useThemeColors();
  color = color ? color : colors.primary.accent;
  const messageBoardState = useMessageStore(
    (state) => customMessage || state.message
  );
  const announcements = useMessageStore((state) => state.announcements);
  const fontScale = Dimensions.get("window").fontScale;

  return !messageBoardState.visible ||
    (announcements && announcements.length) ? null : (
    <View
      style={{
        width: "100%",
        paddingHorizontal: Spacing.LEVEL_3,
        marginBottom: Spacing.LEVEL_4
      }}
    >
      <Pressable
        onPress={messageBoardState.onPress}
        type="plain"
        style={{
          paddingVertical: Spacing.LEVEL_3,
          paddingHorizontal: Spacing.LEVEL_2,
          backgroundColor: colors.primary.shade,
          borderRadius: Radius.S,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            flexShrink: 1,
            gap: Spacing.LEVEL_1
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: Radius.XS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary.background
            }}
          >
            <Icon
              size={16}
              color={colors.primary.icon}
              allowFontScaling
              name={messageBoardState.icon}
            />
          </View>

          <View
            style={{
              gap: Spacing.LEVEL_0,
              flexShrink: 1
            }}
          >
            <Heading
              style={{
                flexWrap: "nowrap",
                flexShrink: 1
              }}
              fontSize="MD"
              color={colors.primary.heading}
            >
              {messageBoardState.actionText}
            </Heading>
            <Paragraph color={colors.secondary.paragraph} fontSize="SM">
              {messageBoardState.message}
            </Paragraph>
          </View>
        </View>

        <AppIcon size={24} name="chevron-right" color={colors.primary.icon} />
      </Pressable>
    </View>
  );
};
