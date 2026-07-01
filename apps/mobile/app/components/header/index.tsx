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
import React, { useCallback, useEffect, useState } from "react";
import { Platform, View, ViewStyle } from "react-native";
import { notesnook } from "../../../e2e/test.ids";
import { Radius, Spacing } from "../../common/design/spacing";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { RouteName } from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { eScrollEvent } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { IconButton, IconButtonProps } from "../ui/icon-button";
import Heading from "../ui/typography/heading";

export const Header = ({
  renderedInRoute,
  onLeftMenuButtonPress,
  title,
  id,
  canGoBack,
  hasSearch,
  onSearch,
  rightButton,
  style
}: {
  onLeftMenuButtonPress?: () => void;
  renderedInRoute?: RouteName;
  id?: string;
  title?: string;
  canGoBack?: boolean;
  onPressDefaultRightButton?: () => void;
  hasSearch?: boolean;
  onSearch?: () => void;
  rightButton?: IconButtonProps;
  style?: ViewStyle;
}) => {
  const { colors } = useThemeColors();
  const [borderHidden, setBorderHidden] = useState(true);
  const [selectedItemsList, selectionMode] = useSelectionStore((state) => [
    state.selectedItemsList,
    state.selectionMode
  ]);

  const deviceMode = useSettingStore((state) => state.deviceMode);
  const isTablet = deviceMode === "tablet";

  const onScroll = useCallback(
    (data: { x: number; y: number; id?: string; route: string }) => {
      if (data.route !== renderedInRoute || data.id !== id) return;
      if (data.y > 150) {
        if (!borderHidden) return;
        setBorderHidden(false);
      } else {
        if (borderHidden) return;
        setBorderHidden(true);
      }
    },
    [borderHidden, id, renderedInRoute]
  );

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [borderHidden, onScroll]);

  const _onLeftButtonPress = () => {
    if (onLeftMenuButtonPress) return onLeftMenuButtonPress();

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

  return (
    <View
      style={{
        paddingHorizontal: Spacing.LEVEL_3,
        marginTop: Platform.OS === "android" ? 5 : 0
      }}
    >
      <View
        style={[
          {
            flexDirection: "row",
            justifyContent: "space-between",
            borderRadius: Radius.S,
            paddingVertical: Spacing.LEVEL_3,
            backgroundColor: colors.secondary.background,
            alignItems: "center"
          },
          style
        ]}
        testID="search-header"
      >
        {isTablet && !canGoBack ? null : (
          <IconButton
            testID={notesnook.ids.default.header.buttons.left}
            left={40}
            top={40}
            onPress={_onLeftButtonPress}
            onLongPress={() => {
              Navigation.popToTop();
            }}
            style={{
              width: 20,
              height: 20
            }}
            size={20}
            name={canGoBack ? "arrow-back" : "menu"}
            iconFamily="notesnook"
            color={colors.primary.icon}
          />
        )}

        {!title ? (
          <View
            style={{
              width: 100,
              backgroundColor: colors.primary.hover,
              height: 10,
              borderRadius: 100
            }}
          />
        ) : (
          <Heading fontSize="XL">
            {selectionMode ? `${selectedItemsList.length} selected` : title}
          </Heading>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          {rightButton ? (
            <IconButton {...rightButton} color={colors.primary.icon} />
          ) : null}

          {hasSearch ? (
            <IconButton
              color={colors.primary.icon}
              size={20}
              onPress={() => {
                onSearch?.();
              }}
              style={{
                width: 20,
                height: 20
              }}
              iconFamily="notesnook"
              name="search"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
};
