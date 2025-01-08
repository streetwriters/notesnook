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
import { useThemeColors } from "@notesnook/theme";
import { Menu } from "react-native-material-menu";
import { notesnook } from "../../../e2e/test.ids";
import {
  HeaderRightButton,
  RouteName
} from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";

export const RightMenus = ({
  headerRightButtons,
  renderedInRoute,
  id,
  onPressDefaultRightButton,
  search,
  onSearch
}: {
  headerRightButtons?: HeaderRightButton[];
  renderedInRoute?: RouteName;
  id?: string;
  onPressDefaultRightButton?: () => void;
  search?: boolean;
  onSearch?: () => void;
}) => {
  const { colors } = useThemeColors();
  const { colors: contextMenuColors } = useThemeColors("contextMenu");
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const menuRef = useRef<Menu>(null);

  return (
    <View style={styles.rightBtnContainer}>
      {search ? (
        <IconButton
          onPress={onSearch}
          testID="icon-search"
          name="magnify"
          color={colors.primary.paragraph}
          style={styles.rightBtn}
        />
      ) : null}

      {deviceMode !== "mobile" ? (
        <Button
          onPress={onPressDefaultRightButton}
          testID={notesnook.ids.default.addBtn}
          icon={renderedInRoute === "Trash" ? "delete" : "plus"}
          iconSize={SIZE.xl}
          type="accent"
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
            borderRadius: 100,
            paddingHorizontal: 0,
            borderWidth: 1,
            borderColor: colors.primary.accent
          }}
        />
      ) : null}

      {headerRightButtons && headerRightButtons.length > 0 ? (
        <Menu
          ref={menuRef}
          animationDuration={200}
          style={{
            borderRadius: 5,
            backgroundColor: contextMenuColors.primary.background,
            marginTop: 35
          }}
          onRequestClose={() => {
            //@ts-ignore
            menuRef.current?.hide();
          }}
          anchor={
            <IconButton
              onPress={() => {
                //@ts-ignore
                menuRef.current?.show();
              }}
              name="dots-vertical"
              color={colors.primary.paragraph}
              style={styles.rightBtn}
            />
          }
        >
          {headerRightButtons.map((item) => (
            <Button
              style={{
                justifyContent: "flex-start",
                borderRadius: 0,
                alignSelf: "flex-start",
                width: "100%"
              }}
              type="plain"
              buttonType={{
                text: contextMenuColors.primary.paragraph
              }}
              key={item.title}
              title={item.title}
              onPress={async () => {
                //@ts-ignore
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
