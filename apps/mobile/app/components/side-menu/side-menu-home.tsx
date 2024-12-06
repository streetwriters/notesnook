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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { DraxProvider, DraxScrollView } from "react-native-drax";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { MenuItemsList } from "../../utils/menu-items";
import { DefaultAppStyles } from "../../utils/styles";
import ReorderableList from "../list/reorderable-list";
import { ColorSection } from "./color-section";
import { MenuItem } from "./menu-item";
import { PinnedSection } from "./pinned-section";
import { SideMenuHeader } from "./side-menu-header";

export function SideMenuHome() {
  const { colors } = useThemeColors();
  const [isAppLoading, introCompleted] = useSettingStore((state) => [
    state.isAppLoading,
    state.settings.introCompleted
  ]);
  const [order, hiddensItems] = useMenuStore((state) => [
    state.order["routes"],
    state.hiddenItems["routes"]
  ]);

  return (
    <View
      style={{
        height: "100%",
        width: "100%",
        paddingTop: DefaultAppStyles.GAP_SMALL,
        backgroundColor: colors.primary.background,
        gap: DefaultAppStyles.GAP,
        paddingHorizontal: DefaultAppStyles.GAP
      }}
    >
      <SideMenuHeader />

      {!isAppLoading && introCompleted ? (
        <DraxProvider>
          <DraxScrollView nestedScrollEnabled={false}>
            <ReorderableList
              onListOrderChanged={(data) => {
                db.settings.setSideBarOrder("routes", data);
              }}
              onHiddenItemsChanged={(data) => {
                db.settings.setSideBarHiddenItems("routes", data);
              }}
              itemOrder={order}
              hiddenItems={hiddensItems}
              alwaysBounceVertical={false}
              data={MenuItemsList}
              style={{
                width: "100%"
              }}
              contentContainerStyle={{
                gap: 2
              }}
              showsVerticalScrollIndicator={false}
              renderDraggableItem={({ item, index }) => {
                return (
                  <MenuItem
                    key={item.title}
                    item={{
                      ...item,
                      title:
                        strings.routes[
                          item.title as keyof typeof strings.routes
                        ]?.() || item.title
                    }}
                    testID={item.title}
                    index={index}
                  />
                );
              }}
            />
            <ColorSection />
            <PinnedSection />
          </DraxScrollView>
        </DraxProvider>
      ) : null}
    </View>
  );
}
