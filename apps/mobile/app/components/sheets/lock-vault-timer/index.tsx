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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import { presentSheet } from "../../../services/event-manager";
import { useSettingStore } from "../../../stores/use-setting-store";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const OPTIONS = [
  1000 * 60 * 1,
  1000 * 60 * 5,
  1000 * 60 * 10,
  1000 * 60 * 15,
  1000 * 60 * 30,
  1000 * 60 * 45,
  1000 * 60 * 60,
  -1
];

const formatValue = (item: number) => {
  return item === -1
    ? strings.never()
    : item < 1000 * 60 * 60
      ? strings.minutes(item / (1000 * 60))
      : strings.hours(item / (1000 * 60 * 60));
};

type LockVaultTimerProps = {
  close?: (ctx?: string) => void;
};

function LockVaultTimer({ close }: LockVaultTimerProps) {
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const [currentValue, setCurrentValue] = useState(
    useSettingStore.getState().vaultLockAfter
  );

  const onChange = async (item: number) => {
    await db.settings.setVaultLockAfter(item);
    useSettingStore.setState({
      vaultLockAfter: item
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
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: Spacing.LEVEL_1,
            paddingTop: Spacing.LEVEL_2
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
              name="clock"
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
              {strings.lockVaultAfter()}
            </Heading>
            <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
              {strings.lockVaultAfterDesc()}
            </Paragraph>
          </View>
        </View>
      </View>

      <View
        style={{
          width: "100%",
          backgroundColor: colors.primary.background,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_2,
          gap: Spacing.LEVEL_2
        }}
      >
        {OPTIONS.map((item) => {
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
              <Heading
                fontFamily="MEDIUM"
                fontSize="SM"
                lineHeight="100%"
                color={colors.primary.heading}
              >
                {formatValue(item)}
              </Heading>

              <AppIcon
                name={selected ? "radio-button" : "ellipse"}
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
    </ScrollView>
  );
}

LockVaultTimer.present = () => {
  presentSheet({
    component: (_ref, close) => <LockVaultTimer close={close} />
  });
};

export default LockVaultTimer;
