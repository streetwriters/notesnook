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

import { DATE_FORMATS } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React, { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { db } from "../../../common/database";
import { Radius, Spacing } from "../../../common/design/spacing";
import { presentSheet } from "../../../services/event-manager";
import { useSettingStore } from "../../../stores/use-setting-store";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

type DateFormatProps = {
  close?: (ctx?: string) => void;
};

function DateFormat({ close }: DateFormatProps) {
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const [currentValue, setCurrentValue] = useState(db.settings.getDateFormat());

  const onChange = async (item: string) => {
    db.settings.setDateFormat(item);
    useSettingStore.setState({
      dateFormat: item
    });
    setCurrentValue(item);
    close?.();
  };

  return (
    <ScrollView
      style={{
        maxHeight: height * 0.8
      }}
    >
      <View
        style={{
          width: "100%",
          backgroundColor: colors.primary.background,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_2,
          gap: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: Spacing.LEVEL_1
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: Radius.XS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary.background
            }}
          >
            <AppIcon
              name="calendar-day"
              iconFamily="notesnook"
              size={16}
              color={colors.primary.icon}
            />
          </View>

          <View
            style={{
              flex: 1,
              gap: Spacing.LEVEL_1
            }}
          >
            <Heading fontSize="XL" lineHeight="100%">
              {strings.dateFormat()}
            </Heading>
            <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
              {strings.dateFormatDesc()}
            </Paragraph>
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary.border
          }}
        />

        <View
          style={{
            gap: Spacing.LEVEL_2
          }}
        >
          {DATE_FORMATS.map((item) => {
            const selected = currentValue === item;
            return (
              <Pressable
                key={item}
                type={selected ? "selected" : "transparent"}
                onPress={() => onChange(item)}
                style={{
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: Spacing.LEVEL_2,
                  borderRadius: Radius.XS,
                  borderWidth: selected ? 0 : 1,
                  borderColor: colors.primary.border
                }}
              >
                <View
                  style={{
                    flex: 1,
                    gap: Spacing.LEVEL_1
                  }}
                >
                  <Heading
                    fontFamily="MEDIUM"
                    fontSize="SM"
                    lineHeight="100%"
                    color={colors.primary.heading}
                  >
                    {dayjs().format(item)}
                  </Heading>
                  <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                    {item}
                  </Paragraph>
                </View>

                <AppIcon
                  name={selected ? "checkbox" : "box-empty"}
                  iconFamily="notesnook"
                  size={16}
                  color={
                    selected
                      ? [colors.selected.accent, colors.static.white]
                      : colors.secondary.icon
                  }
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

DateFormat.present = () => {
  presentSheet({
    component: (_ref, close) => <DateFormat close={close} />
  });
};

export default DateFormat;
