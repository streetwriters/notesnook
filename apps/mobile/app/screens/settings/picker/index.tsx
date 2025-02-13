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
import React, { useRef, useState } from "react";
import { View } from "react-native";
import { Menu, MenuItem } from "react-native-material-menu";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Dialog } from "../../../components/dialog";
import { Pressable } from "../../../components/ui/pressable";
import Paragraph from "../../../components/ui/typography/paragraph";
import PremiumService from "../../../services/premium";
import { getColorLinearShade } from "../../../utils/colors";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import { verifyUser } from "../functions";

interface PickerOptions<T> {
  getValue: () => T;
  updateValue: (item: T) => Promise<void>;
  formatValue: (item: T) => any;
  compareValue: (current: T, item: T) => boolean;
  getItemKey: (item: T) => string;
  options: T[];
  premium?: boolean;
  onCheckOptionIsPremium?: (item: T) => boolean;
  requiresVerification?: () => boolean;
  onVerify?: () => Promise<boolean>;
}

export function SettingsPicker<T>({
  getValue,
  updateValue,
  formatValue,
  compareValue,
  options,
  getItemKey,
  premium,
  onCheckOptionIsPremium = () => true,
  requiresVerification = () => false,
  onVerify
}: PickerOptions<T>) {
  const { colors, isDark } = useThemeColors("contextMenu");
  const menuRef = useRef<any>();
  const [width, setWidth] = useState(0);
  const [currentValue, setCurrentValue] = useState(getValue());

  const onChange = async (item: T) => {
    if (premium && onCheckOptionIsPremium?.(item)) {
      await PremiumService.verify(
        async () => {
          menuRef.current?.hide();
          await updateValue(item);
          setCurrentValue(item);
        },
        async () => {
          menuRef.current?.hide();
          await sleep(300);
          PremiumService.sheet();
        }
      );
      return;
    }

    menuRef.current?.hide();
    await updateValue(item);
    setCurrentValue(item);
  };

  return (
    <View
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
      style={{
        width: "100%"
      }}
    >
      <Menu
        ref={menuRef}
        animationDuration={200}
        style={{
          borderRadius: defaultBorderRadius,
          backgroundColor: colors.primary.background,
          width: width,
          marginTop: 60,
          overflow: "hidden",
          borderWidth: 0.7,
          borderColor: getColorLinearShade(
            colors.primary.background,
            0.07,
            isDark
          )
        }}
        onRequestClose={() => {
          menuRef.current?.hide();
        }}
        anchor={
          <Pressable
            onPress={async () => {
              if (onVerify && !(await onVerify())) return;
              menuRef.current?.show();
            }}
            type="secondary"
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              width: "100%",
              justifyContent: "space-between",
              padding: 12
            }}
          >
            <Paragraph>{formatValue(currentValue)}</Paragraph>
            <Icon
              color={colors.primary.icon}
              name="menu-down"
              size={AppFontSize.md}
            />
          </Pressable>
        }
      >
        <Dialog context="local" />

        {options.map((item) => (
          <MenuItem
            key={getItemKey(item)}
            onPress={async () => {
              if (requiresVerification?.()) {
                verifyUser("local", () => {
                  onChange(item);
                });
              } else {
                onChange(item);
              }
            }}
            pressColor={colors.primary.hover}
            style={{
              backgroundColor: compareValue(currentValue, item)
                ? colors.selected.background
                : "transparent",
              width: "100%",
              maxWidth: width
            }}
            textStyle={{
              fontSize: AppFontSize.md,
              color: compareValue(currentValue, item)
                ? colors.primary.accent
                : colors.primary.paragraph
            }}
          >
            {formatValue(item)}
          </MenuItem>
        ))}
      </Menu>
    </View>
  );
}

export function createSettingsPicker<T>(props: PickerOptions<T>) {
  const Selector = () => {
    return <SettingsPicker {...props} />;
  };
  return Selector;
}
