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

import React, { useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Menu from "react-native-reanimated-material-menu";
import { notesnook } from "../../../e2e/test.ids";
import Navigation from "../../services/navigation";
import SearchService from "../../services/search";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";

export const RightMenus = () => {
  const colors = useThemeStore((state) => state.colors);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const rightButtons = useNavigationStore((state) => state.headerRightButtons);
  const currentScreen = useNavigationStore((state) => state.currentScreen.name);
  const buttonAction = useNavigationStore((state) => state.buttonAction);
  const menuRef = useRef();

  return (
    <View style={styles.rightBtnContainer}>
      {!currentScreen.startsWith("Settings") ? (
        <IconButton
          onPress={async () => {
            SearchService.prepareSearch();
            Navigation.navigate({
              name: "Search"
            });
          }}
          testID="icon-search"
          name="magnify"
          color={colors.pri}
          customStyle={styles.rightBtn}
        />
      ) : null}

      {deviceMode !== "mobile" ? (
        <Button
          onPress={buttonAction}
          testID={notesnook.ids.default.addBtn}
          icon={currentScreen === "Trash" ? "delete" : "plus"}
          iconSize={SIZE.xl}
          type="shade"
          hitSlop={{
            top: 10,
            right: 10,
            bottom: 10,
            left: 0
          }}
          style={{
            marginLeft: 10,
            width: 32,
            height: 32,
            borderRadius: 5,
            paddingHorizontal: 0,
            borderWidth: 1,
            borderColor: colors.accent
          }}
        />
      ) : null}

      {rightButtons && rightButtons.length > 0 ? (
        <Menu
          ref={menuRef}
          animationDuration={200}
          style={{
            borderRadius: 5,
            backgroundColor: colors.bg
          }}
          onRequestClose={() => {
            menuRef.current?.hide();
          }}
          anchor={
            <IconButton
              onPress={() => {
                menuRef.current?.show();
              }}
              name="dots-vertical"
              color={colors.pri}
              customStyle={styles.rightBtn}
            />
          }
        >
          {rightButtons.map((item) => (
            <Button
              style={{
                width: 150,
                justifyContent: "flex-start",
                borderRadius: 0
              }}
              type="gray"
              buttonType={{
                text: colors.pri
              }}
              key={item.title}
              title={item.title}
              onPress={async () => {
                menuRef.current?.hide();
                if (Platform.OS === "ios") await sleep(300);
                item.onPress();
              }}
            />
          ))}
        </Menu>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  rightBtnContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  rightBtn: {
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    marginLeft: 10,
    paddingRight: 0
  }
});
