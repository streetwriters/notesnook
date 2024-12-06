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
import React from "react";
import { notesnook } from "../../../e2e/test.ids";
import Navigation from "../../services/navigation";
import { useSettingStore } from "../../stores/use-setting-store";
import { fluidTabsRef } from "../../utils/global-refs";
import { IconButton } from "../ui/icon-button";

export const LeftMenus = ({
  canGoBack,
  onLeftButtonPress
}: {
  canGoBack?: boolean;
  onLeftButtonPress?: () => void;
}) => {
  const { colors } = useThemeColors();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const isTablet = deviceMode === "tablet";

  const _onLeftButtonPress = () => {
    if (onLeftButtonPress) return onLeftButtonPress();

    if (!canGoBack) {
      if (fluidTabsRef.current?.isDrawerOpen()) {
        Navigation.closeDrawer();
      } else {
        Navigation.openDrawer();
      }
      return;
    }
    Navigation.goBack();
  };

  return isTablet && !canGoBack ? null : (
    <IconButton
      testID={notesnook.ids.default.header.buttons.left}
      left={40}
      top={40}
      onPress={_onLeftButtonPress}
      onLongPress={() => {
        Navigation.popToTop();
      }}
      name={canGoBack ? "arrow-left" : "menu"}
      color={colors.primary.icon}
    />
  );
};
