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
import { Image, TextStyle, View, ViewStyle } from "react-native";
import { MMKV } from "../../common/database/mmkv";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { TTip } from "../../services/tip-manager";
import { ThemeStore, useThemeStore } from "../../stores/use-theme-store";
import { eCloseSheet } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";
export const Tip = ({
  tip,
  style,
  neverShowAgain,
  noImage,
  textStyle,
  color
}: {
  tip: TTip;
  style?: ViewStyle;
  textStyle?: TextStyle;
  neverShowAgain: boolean;
  noImage?: boolean;
  color?: keyof ThemeStore["colors"];
}) => {
  const colors = useThemeStore((state) => state.colors);

  return tip ? (
    <View
      style={[
        {
          borderRadius: 10,
          padding: 12,
          width: "100%",
          alignSelf: "center",
          paddingVertical: 12,
          backgroundColor: colors.nav
        },
        style
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between"
        }}
      >
        <Button
          title="TIP"
          icon="information"
          fontSize={SIZE.xs}
          iconSize={SIZE.xs}
          style={{
            width: undefined,
            height: 22,
            paddingHorizontal: 4,
            alignSelf: "flex-start",
            borderRadius: 100,
            borderWidth: 1,
            borderColor: colors[color as keyof typeof colors] as string
          }}
        />

        {neverShowAgain && (
          <Button
            title="Never show again"
            type="grayBg"
            icon="close"
            fontSize={SIZE.xs}
            iconSize={SIZE.xs}
            onPress={() => {
              MMKV.setItem("neverShowSheetTips", "true");
              eSendEvent(eCloseSheet);
            }}
            style={{
              width: undefined,
              height: 25,
              paddingHorizontal: 4,
              alignSelf: "flex-start",
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.icon
            }}
          />
        )}
      </View>

      <Seperator half />
      <Paragraph style={textStyle} color={colors.pri} size={SIZE.md}>
        {tip.text}
      </Paragraph>
      {tip.image && !noImage && (
        <View
          style={{
            borderRadius: 10,
            overflow: "hidden",
            marginTop: 10
          }}
        >
          <Image
            source={{ uri: tip.image }}
            style={{
              width: "100%",
              height: 230,
              alignSelf: "center"
            }}
          />
        </View>
      )}

      {tip.button && (
        <Button
          title={tip.button.title}
          type="accent"
          icon={tip.button.icon}
          accentText="light"
          accentColor={color}
          style={{
            marginTop: 10
          }}
          onPress={() => {
            switch (tip.button?.action) {
              default:
                break;
            }
          }}
        />
      )}
    </View>
  ) : null;
};

Tip.present = async (tip: TTip) => {
  if (!tip) return;
  const dontShow = MMKV.getString("neverShowSheetTips");
  if (dontShow) return;
  presentSheet({
    component: (
      <Tip
        tip={tip}
        neverShowAgain={true}
        style={{
          backgroundColor: "transparent",
          paddingHorizontal: 12
        }}
      />
    )
  });
};
