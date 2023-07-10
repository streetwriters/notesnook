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

import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { SearchBar } from "../../screens/search/search-bar";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useThemeColors } from "@notesnook/theme";
import { eScrollEvent } from "../../utils/events";
import { LeftMenus } from "./left-menus";
import { RightMenus } from "./right-menus";
import { Title } from "./title";

const _Header = () => {
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  const [hide, setHide] = useState(true);
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const currentScreen = useNavigationStore(
    (state) => state.currentScreen?.name
  );

  const onScroll = useCallback(
    (data) => {
      if (data.y > 150) {
        if (!hide) return;
        setHide(false);
      } else {
        if (hide) return;
        setHide(true);
      }
    },
    [hide]
  );

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [hide, onScroll]);

  return selectionMode ? null : (
    <>
      <View
        style={[
          styles.container,
          {
            marginTop: Platform.OS === "android" ? insets.top : null,
            backgroundColor: colors.primary.background,
            overflow: "hidden",
            borderBottomWidth: 1,
            borderBottomColor: hide
              ? "transparent"
              : colors.secondary.background,
            justifyContent: "space-between"
          }
        ]}
      >
        {currentScreen === "Search" ? (
          <SearchBar />
        ) : (
          <>
            <View style={styles.leftBtnContainer}>
              <LeftMenus />
              <Title />
            </View>
            <RightMenus />
          </>
        )}
      </View>
    </>
  );
};
export const Header = React.memo(_Header, () => true);

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
