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
import { Image, TouchableOpacity, View } from "react-native";
//@ts-ignore
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { Radius, Spacing } from "../../common/design/spacing";
import Heading from "../ui/typography/heading";

export const ReviewItem = (props: {
  review: string;
  user: string;
  userSource: string;
  link: string;
  userImage?: string;
}) => {
  const { colors } = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => {
        openLinkInBrowser(props.link);
      }}
      style={{
        width: "100%",
        padding: Spacing.LEVEL_4,
        borderWidth: 1,
        backgroundColor: colors.secondary.background,
        borderRadius: Radius.LG,
        borderColor: colors.primary.border
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingBottom: Spacing.LEVEL_4
        }}
      >
        {props.userImage ? (
          <Image
            source={{
              uri: props.userImage
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 100
            }}
          />
        ) : null}
        <View>
          <Heading size={AppFontSize.sm}>{props.user}</Heading>
          <Paragraph size={AppFontSize.xs} color={colors.primary.paragraph}>
            {props.userSource}
          </Paragraph>
        </View>
      </View>

      <Paragraph>{props.review}</Paragraph>
    </TouchableOpacity>
  );
};
