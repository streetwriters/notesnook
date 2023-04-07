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

import React, { useRef, useState } from "react";
import { View } from "react-native";
import Menu, { MenuItem } from "react-native-reanimated-material-menu";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { PressableButton } from "../../components/ui/pressable";
import Paragraph from "../../components/ui/typography/paragraph";
import { DDS } from "../../services/device-detection";
import { ToastEvent } from "../../services/event-manager";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import {
  hexToRGBA,
  RGB_Linear_Shade,
  switchAccentColor
} from "../../utils/color-scheme/utils";
import { MenuItemsList } from "../../utils/constants";
import { SIZE } from "../../utils/size";
export const HomagePageSelector = () => {
  const colors = useThemeStore((state) => state.colors);
  const settings = useSettingStore((state) => state.settings);
  const menuRef = useRef();
  const [width, setWidth] = useState(0);
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
          borderRadius: 5,
          backgroundColor: colors.bg,
          width: width,
          marginTop: 60
        }}
        onRequestClose={() => {
          menuRef.current?.hide();
        }}
        anchor={
          <PressableButton
            onPress={async () => {
              await PremiumService.verify(menuRef.current?.show);
            }}
            type="grayBg"
            customStyle={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              width: "100%",
              justifyContent: "space-between",
              padding: 12
            }}
          >
            <Paragraph>{settings.homepage}</Paragraph>
            <Icon color={colors.icon} name="menu-down" size={SIZE.md} />
          </PressableButton>
        }
      >
        {MenuItemsList.slice(0, MenuItemsList.length - 1).map(
          (item) =>
            item.name !== "Monographs" && (
              <MenuItem
                key={item.name}
                onPress={async () => {
                  menuRef.current?.hide();
                  await SettingsService.set({ homepage: item.name });
                  ToastEvent.show({
                    heading: "Homepage set to " + item.name,
                    message: "Restart the app for changes to take effect.",
                    type: "success"
                  });
                }}
                style={{
                  backgroundColor:
                    settings.homepage === item.name
                      ? colors.nav
                      : "transparent",
                  width: "100%",
                  maxWidth: width
                }}
                textStyle={{
                  fontSize: SIZE.md,
                  color:
                    settings.homepage === item.name ? colors.accent : colors.pri
                }}
              >
                {item.name}
              </MenuItem>
            )
        )}
      </Menu>
    </View>
  );
};

export const AccentColorPicker = () => {
  const colors = useThemeStore((state) => state.colors);
  function changeAccentColor(color) {
    switchAccentColor(color);
  }

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        width: "100%"
      }}
    >
      {[
        "#FF5722",
        "#FFA000",
        "#1B5E20",
        "#008837",
        "#757575",
        "#0560ff",
        "#009688",
        "#2196F3",
        "#880E4F",
        "#9C27B0",
        "#FF1744",
        "#B71C1C"
      ].map((item) => (
        <PressableButton
          key={item}
          customColor={
            colors.accent === item
              ? RGB_Linear_Shade(!colors.night ? -0.2 : 0.2, hexToRGBA(item, 1))
              : item
          }
          customSelectedColor={item}
          alpha={!colors.night ? -0.1 : 0.1}
          opacity={1}
          onPress={async () => {
            await PremiumService.verify(async () => {
              changeAccentColor(item);
              SettingsService.set({
                theme: {
                  accent: item,
                  dark: SettingsService.get().theme.dark
                }
              });
            });
          }}
          customStyle={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
            marginVertical: 5,
            width: DDS.isLargeTablet() ? 40 : 50,
            height: DDS.isLargeTablet() ? 40 : 50,
            borderRadius: 100
          }}
        >
          {colors.accent === item ? (
            <Icon
              size={DDS.isLargeTablet() ? SIZE.lg : SIZE.xxl}
              color="white"
              name="check"
            />
          ) : null}
        </PressableButton>
      ))}
      <View style={{ width: 50 }} />
    </View>
  );
};
