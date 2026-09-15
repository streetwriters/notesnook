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
import { Text, View, ViewStyle } from "react-native";
import { Radius, Spacing } from "../../common/design/spacing";
import { DefaultAppStyles } from "../../utils/styles";
import AppIcon, { IconProps } from "../ui/AppIcon";
import { Button, ButtonProps } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

type DialogHeaderProps = {
  icon?: string;
  iconFamily?: IconProps["iconFamily"];
  iconType?: "error" | "normal";
  title?: string;
  paragraph?: string;
  button?: ButtonProps;
  paragraphColor?: string;
  padding?: number;
  centered?: boolean;
  titlePart?: string;
  style?: ViewStyle;
};

const DialogHeader = ({
  title,
  paragraph,
  button,
  paragraphColor,
  padding,
  centered,
  titlePart,
  style,
  icon,
  iconFamily,
  iconType
}: DialogHeaderProps) => {
  const { colors } = useThemeColors();

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: padding,
          ...style
        }}
      >
        <View
          style={{
            width: "100%",
            gap: Spacing.LEVEL_4
          }}
        >
          {icon ? (
            <View
              style={{
                alignSelf: centered ? "center" : "flex-start",
                width: 40,
                height: 40,
                backgroundColor: colors.error.shade,
                justifyContent: "center",
                alignItems: "center",
                borderRadius: Radius.XS
              }}
            >
              <AppIcon
                name={icon}
                iconFamily={iconFamily}
                color={
                  iconType == "error" ? colors.static.red : colors.primary.icon
                }
              />
            </View>
          ) : null}

          <View
            style={{
              gap: Spacing.LEVEL_1
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: centered ? "center" : "space-between",
                alignItems: "center"
              }}
            >
              <Heading
                style={{ textAlign: centered ? "center" : "left" }}
                fontSize="XL"
              >
                {title}{" "}
                {titlePart ? (
                  <Text style={{ color: colors.primary.accent }}>
                    {titlePart}
                  </Text>
                ) : null}
              </Heading>

              {button ? (
                <Button
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: DefaultAppStyles.GAP
                  }}
                  fontSize={13}
                  type={button.type || "secondary"}
                  height={30}
                  {...button}
                />
              ) : null}
            </View>

            {paragraph ? (
              <Paragraph
                style={{
                  textAlign: centered ? "center" : "left",
                  maxWidth: centered ? "90%" : "100%",
                  alignSelf: centered ? "center" : "flex-start"
                }}
                color={paragraphColor || colors.secondary.paragraph}
              >
                {paragraph}
              </Paragraph>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
};

export default DialogHeader;
