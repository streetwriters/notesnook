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
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { getFontById, getFonts } from "@notesnook/editor/dist/utils/font";

export const FontSelector = () => {
  const colors = useThemeStore((state) => state.colors);
  const defaultFontFamily = useSettingStore(
    (state) => state.settings.defaultFontFamily
  );
  const menuRef = useRef();
  const [width, setWidth] = useState(0);

  const onChange = (item) => {
    menuRef.current?.hide();
    SettingsService.set({
      defaultFontFamily: item
    });
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
              menuRef.current?.show();
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
            <Paragraph>{getFontById(defaultFontFamily).title}</Paragraph>
            <Icon color={colors.icon} name="menu-down" size={SIZE.md} />
          </PressableButton>
        }
      >
        {getFonts().map((item) => (
          <MenuItem
            key={item.id}
            onPress={async () => {
              onChange(item.id);
            }}
            style={{
              backgroundColor:
                defaultFontFamily === item.id ? colors.nav : "transparent",
              width: "100%",
              maxWidth: width
            }}
            textStyle={{
              fontSize: SIZE.md,
              color: defaultFontFamily === item.id ? colors.accent : colors.pri
            }}
          >
            {item.title}
          </MenuItem>
        ))}
      </Menu>
    </View>
  );
};
