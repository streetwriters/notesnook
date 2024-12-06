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
import { useMessageStore } from "../../stores/use-message-store";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";

export const Card = ({ color }: { color?: string }) => {
  const { colors } = useThemeColors();
  color = color ? color : colors.primary.accent;
  const messageBoardState = useMessageStore((state) => state.message);
  const announcements = useMessageStore((state) => state.announcements);
  const fontScale = Dimensions.get("window").fontScale;

  return !messageBoardState.visible ||
    (announcements && announcements.length) ? null : (
    <View
      style={{
        width: "100%",
        paddingHorizontal: DefaultAppStyles.GAP,
        marginTop: DefaultAppStyles.GAP
      }}
    >
      <Pressable
        onPress={messageBoardState.onPress}
        type="plain"
        style={{
          paddingVertical: DefaultAppStyles.GAP_VERTICAL,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DefaultAppStyles.GAP_SMALL,
          width: "100%",
          backgroundColor: colors.secondary.background,
          borderWidth: 1,
          borderColor: colors.primary.border
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexShrink: 1
          }}
        >
          <View
            style={{
              width: 40 * fontScale,
              height: 40 * fontScale,
              borderRadius: 100,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Icon
              size={SIZE.xxxl}
              color={
                messageBoardState.type === "error" ? colors.error.icon : color
              }
              allowFontScaling
              name={messageBoardState.icon}
            />
          </View>

          <View
            style={{
              marginLeft: 10,
              marginRight: 10
            }}
          >
            <Paragraph
              style={{
                flexWrap: "nowrap",
                flexShrink: 1
              }}
              color={colors.primary.heading}
            >
              {messageBoardState.actionText}
            </Paragraph>
            <Paragraph color={colors.secondary.paragraph} size={SIZE.xxs}>
              {messageBoardState.message}
            </Paragraph>
          </View>
        </View>

        {fontScale > 1 ? null : (
          <View
            style={{
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Icon
              name="chevron-right"
              color={
                messageBoardState.type === "error" ? colors.error.icon : color
              }
              size={SIZE.lg}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
};
