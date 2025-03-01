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
import { Image, TextStyle, View, ViewStyle } from "react-native";
import { MMKV } from "../../common/database/mmkv";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { TTip } from "../../services/tip-manager";
import { eCloseSheet } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../utils/styles";

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
  neverShowAgain?: boolean;
  noImage?: boolean;
  color?: string;
}) => {
  const { colors } = useThemeColors();

  return tip ? (
    <View
      style={[
        {
          borderRadius: 10,
          paddingHorizontal: DefaultAppStyles.GAP,
          width: "100%",
          alignSelf: "center",
          paddingVertical: DefaultAppStyles.GAP_VERTICAL,
          backgroundColor: colors.secondary.background
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
          title={strings.tip()}
          icon="information"
          fontSize={AppFontSize.xxxs}
          iconSize={AppFontSize.xs}
          style={{
            paddingHorizontal: DefaultAppStyles.GAP_SMALL / 2,
            paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL / 2,
            alignSelf: "flex-start",
            borderRadius: 100,
            borderWidth: 1,
            borderColor: colors.secondary.border
          }}
          textStyle={{
            color: colors.secondary.paragraph
          }}
          iconColor={colors.secondary.icon}
          type="plain"
        />

        {neverShowAgain && (
          <Button
            title={strings.neverShowAgain()}
            type="secondary"
            icon="close"
            fontSize={AppFontSize.xs}
            iconSize={AppFontSize.xs}
            onPress={() => {
              MMKV.setItem("neverShowSheetTips", "true");
              eSendEvent(eCloseSheet);
            }}
            style={{
              width: undefined,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
              paddingHorizontal: DefaultAppStyles.GAP_SMALL / 2,
              alignSelf: "flex-start",
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.primary.border
            }}
          />
        )}
      </View>

      <Seperator half />
      <Paragraph
        style={textStyle}
        color={colors.primary.paragraph}
        size={AppFontSize.sm}
      >
        {tip.text()}
      </Paragraph>
      {tip.image && !noImage && (
        <View
          style={{
            borderRadius: 10,
            overflow: "hidden",
            marginTop: DefaultAppStyles.GAP_VERTICAL
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
          buttonType={{
            color: colors.static[color as never],
            text: colors.primary.accentForeground
          }}
          style={{
            marginTop: DefaultAppStyles.GAP_VERTICAL
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
          paddingHorizontal: DefaultAppStyles.GAP
        }}
      />
    )
  });
};
