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
import { ScrollView, View } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../utils/size";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { FeatureBlock } from "./feature";
import { ProTag } from "./pro-tag";

export const Group = ({ item, index }) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        paddingHorizontal: 12,
        backgroundColor:
          index % 2 !== 0
            ? colors.primary.background
            : colors.secondary.background,
        paddingVertical: 40
      }}
    >
      {item?.pro ? (
        <ProTag
          size={AppFontSize.sm}
          background={
            index % 2 === 0
              ? colors.primary.background
              : colors.secondary.background
          }
        />
      ) : null}
      <Heading>{item.title}</Heading>
      <Paragraph size={AppFontSize.md}>{item.detail}</Paragraph>

      {item.features && (
        <ScrollView
          style={{
            marginTop: 20
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {item.features?.map((item) => (
            <FeatureBlock
              key={item.detail}
              {...item}
              detail={item.detail}
              pro={item.pro}
              proTagBg={
                index % 2 === 0
                  ? colors.primary.background
                  : colors.secondary.background
              }
            />
          ))}
        </ScrollView>
      )}
      {item.info ? (
        <Paragraph
          style={{
            marginTop: 10
          }}
          size={AppFontSize.xs}
          color={colors.secondary.paragraph}
        >
          {item.info}
        </Paragraph>
      ) : null}
    </View>
  );
};
