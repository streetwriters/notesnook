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
import { Text, View, ViewStyle } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import { PressableProps } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

type DialogHeaderProps = {
  icon?: string;
  title?: string;
  paragraph?: string;
  button?: {
    onPress?: () => void;
    loading?: boolean;
    title?: string;
    type?: PressableProps["type"];
    icon?: string;
  };
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
  style
}: DialogHeaderProps) => {
  const { colors } = useThemeColors();

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 50,
          paddingHorizontal: padding,
          ...style
        }}
      >
        <View
          style={{
            width: "100%"
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
              size={AppFontSize.lg}
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
                onPress={button.onPress}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 12
                }}
                loading={button.loading}
                fontSize={13}
                title={button.title}
                icon={button.icon}
                type={button.type || "secondary"}
                height={30}
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
    </>
  );
};

export default DialogHeader;
