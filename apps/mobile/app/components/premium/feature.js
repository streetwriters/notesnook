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
import { Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeColors } from "@notesnook/theme";
import { defaultBorderRadius, AppFontSize } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { ProTag } from "./pro-tag";

export const FeatureBlock = ({
  vertical,
  highlight,
  content,
  icon,
  pro,
  proTagBg
}) => {
  const { colors } = useThemeColors();

  return vertical ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        marginBottom: 10,
        backgroundColor: colors.secondary.background,
        borderRadius: 10,
        paddingVertical: 12
      }}
    >
      <Paragraph
        style={{
          flexWrap: "wrap",
          marginLeft: 5,
          flexShrink: 1
        }}
        size={AppFontSize.sm}
      >
        {content}
      </Paragraph>
    </View>
  ) : (
    <View
      style={{
        height: 100,
        justifyContent: "center",
        padding: 10,
        marginRight: 10,
        borderRadius: defaultBorderRadius,
        minWidth: 100
      }}
    >
      <Icon color={colors.primary.icon} name={icon} size={AppFontSize.xl} />
      <Paragraph size={AppFontSize.md}>
        <Text style={{ color: colors.primary.accent }}>{highlight}</Text>
        {content ? "\n" + content : null}
      </Paragraph>

      {pro ? (
        <>
          <View style={{ height: 5 }} />
          <ProTag width={50} size={AppFontSize.xs} background={proTagBg} />
        </>
      ) : (
        <View
          style={{
            width: 30,
            height: 3,
            marginTop: 10,
            borderRadius: 100,
            backgroundColor: colors.primary.accent
          }}
        />
      )}
    </View>
  );
};
