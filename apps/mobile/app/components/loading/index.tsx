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
import { View, ViewStyle } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ProgressBarComponent } from "../ui/svg/lazy";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { SvgView } from "../ui/svg";
import { Radius, Spacing } from "../../common/design/spacing";
export const Loading = (props: {
  title?: string;
  description?: string;
  icon?: string;
  svgSrc?: string;
  style?: ViewStyle;
}) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: colors.primary.background,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.LEVEL_3,
        ...props.style
      }}
    >
      {props.icon ? (
        <Icon name={props.icon} size={80} color={colors.primary.accent} />
      ) : null}

      {props.svgSrc ? (
        <View
          style={{
            marginBottom: Spacing.LEVEL_7
          }}
        >
          <SvgView
            src={props.svgSrc}
            style={{
              width: 180,
              height: 180
            }}
          />
        </View>
      ) : null}

      {props.title ? (
        <Heading
          style={{
            textAlign: "center",
            marginBottom: Spacing.LEVEL_1
          }}
          fontSize="XL"
          lineHeight={null}
        >
          {props.title}
        </Heading>
      ) : null}

      {props.description ? (
        <Paragraph
          style={{
            textAlign: "center",
            marginBottom: Spacing.LEVEL_4
          }}
          fontSize="SM"
        >
          {props.description}
        </Paragraph>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          width: 300
        }}
      >
        <ProgressBarComponent
          height={7}
          width={300}
          animated={true}
          useNativeDriver
          borderRadius={Radius.XS}
          indeterminate
          indeterminateAnimationDuration={2000}
          unfilledColor={colors.secondary.background}
          color={colors.primary.accent}
          borderWidth={0}
        />
      </View>
    </View>
  );
};
