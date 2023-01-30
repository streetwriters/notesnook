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
import { notesnook } from "../../../e2e/test.ids";
import { DDS } from "../../services/device-detection";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { tabBarRef } from "../../utils/global-refs";
import { IconButton } from "../ui/icon-button";

export const LeftMenus = () => {
  const { colors } = useThemeColors();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const canGoBack = useNavigationStore((state) => state.canGoBack);
  const isTablet = deviceMode === "tablet";

  const onLeftButtonPress = () => {
    if (!canGoBack) {
      if (tabBarRef.current?.isDrawerOpen()) {
        Navigation.closeDrawer();
      } else {
        Navigation.openDrawer();
      }
      return;
    }
    Navigation.goBack();
    if (
      useNavigationStore.getState().currentScreen.name === "Signup" ||
      useNavigationStore.getState().currentScreen.name === "Login"
    ) {
      tabBarRef.current.unlock();
    }
  };

  return isTablet && !canGoBack ? null : (
    <IconButton
      testID={notesnook.ids.default.header.buttons.left}
      customStyle={{
        justifyContent: "center",
        alignItems: "center",
        height: 40,
        width: 40,
        borderRadius: 100,
        marginLeft: -5,
        marginRight: DDS.isLargeTablet() ? 10 : 25
      }}
      left={40}
      top={40}
      right={DDS.isLargeTablet() ? 10 : 25}
      onPress={onLeftButtonPress}
      onLongPress={() => {
        Navigation.popToTop();
      }}
      name={canGoBack ? "arrow-left" : "menu"}
      color={colors.primary.paragraph}
      iconStyle={{
        marginLeft: canGoBack ? -5 : 0
      }}
    />
  );
};
