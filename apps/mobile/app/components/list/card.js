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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useMessageStore } from "../../stores/use-message-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { hexToRGBA } from "../../utils/color-scheme/utils";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";

export const Card = ({ color, warning }) => {
  const colors = useThemeStore((state) => state.colors);
  color = color ? color : colors.accent;
  const messageBoardState = useMessageStore((state) => state.message);
  const announcement = useMessageStore((state) => state.announcement);

  return !messageBoardState.visible || announcement || warning ? null : (
    <View
      style={{
        width: "95%"
      }}
    >
      <PressableButton
        onPress={messageBoardState.onPress}
        type="gray"
        customStyle={{
          paddingVertical: 12,
          width: "95%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 0
        }}
      >
        <View
          style={{
            width: 40,
            backgroundColor:
              messageBoardState.type === "error"
                ? hexToRGBA(colors.red, 0.15)
                : hexToRGBA(color, 0.15),
            height: 40,
            borderRadius: 100,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon
            size={SIZE.lg}
            color={
              messageBoardState.type === "error" ? colors.errorText : color
            }
            name={messageBoardState.icon}
          />
        </View>

        <View
          style={{
            marginLeft: 10,
            flexShrink: 1,
            marginRight: 10
          }}
        >
          <Paragraph color={colors.icon} size={SIZE.xs}>
            {messageBoardState.message}
          </Paragraph>
          <Paragraph
            style={{
              flexWrap: "wrap",
              flexShrink: 1
            }}
            color={colors.heading}
          >
            {messageBoardState.actionText}
          </Paragraph>
        </View>

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
            color={messageBoardState.type === "error" ? colors.red : color}
            size={SIZE.lg}
          />
        </View>
      </PressableButton>
    </View>
  );
};
