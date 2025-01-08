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
import { Platform, StyleSheet, View } from "react-native";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import useNavigationStore, {
  RouteName
} from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { eScrollEvent } from "../../utils/events";
import { LeftMenus } from "./left-menus";
import { RightMenus } from "./right-menus";
import { Title } from "./title";

type HeaderRightButton = {
  title: string;
  onPress: () => void;
};

export const Header = ({
  renderedInRoute,
  onLeftMenuButtonPress,
  title,
  titleHiddenOnRender,
  headerRightButtons,
  id,
  accentColor,
  isBeta,
  canGoBack,
  onPressDefaultRightButton,
  hasSearch,
  onSearch
}: {
  onLeftMenuButtonPress?: () => void;
  renderedInRoute?: RouteName;
  id?: string;
  title: string;
  headerRightButtons?: HeaderRightButton[];
  titleHiddenOnRender?: boolean;
  accentColor?: string;
  isBeta?: boolean;
  canGoBack?: boolean;
  onPressDefaultRightButton?: () => void;
  hasSearch?: boolean;
  onSearch?: () => void;
}) => {
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  const [borderHidden, setBorderHidden] = useState(true);
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const isFocused = useNavigationStore((state) => state.focusedRouteId === id);

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

  return selectionMode && isFocused ? null : (
    <>
      <View
        style={[
          styles.container,
          {
            marginTop: Platform.OS === "android" ? insets.top : null,
            backgroundColor: colors.primary.background,
            overflow: "hidden",
            borderBottomWidth: 1,
            borderBottomColor: borderHidden
              ? "transparent"
              : colors.secondary.background,
            justifyContent: "space-between"
          }
        ]}
      >
        <>
          <View style={styles.leftBtnContainer}>
            <LeftMenus
              canGoBack={canGoBack}
              onLeftButtonPress={onLeftMenuButtonPress}
            />

            <Title
              isHiddenOnRender={titleHiddenOnRender}
              renderedInRoute={renderedInRoute}
              id={id}
              accentColor={accentColor}
              title={title}
              isBeta={isBeta}
            />
          </View>
          <RightMenus
            renderedInRoute={renderedInRoute}
            id={id}
            headerRightButtons={headerRightButtons}
            onPressDefaultRightButton={onPressDefaultRightButton}
            search={hasSearch}
            onSearch={onSearch}
          />
        </>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    zIndex: 11,
    height: 50,
    maxHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    width: "100%"
  },
  leftBtnContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    flexShrink: 1
  },
  leftBtn: {
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderRadius: 100,
    marginLeft: -5,
    marginRight: 25
  },
  rightBtnContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  rightBtn: {
    justifyContent: "center",
    alignItems: "flex-end",
    height: 40,
    width: 40,
    paddingRight: 0
  }
});
