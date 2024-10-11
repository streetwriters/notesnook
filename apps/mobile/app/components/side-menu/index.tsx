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
import React, { useCallback } from "react";
import { View } from "react-native";
import { DraxProvider, DraxScrollView } from "react-native-drax";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { eSendEvent } from "../../services/event-manager";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import { eOpenPremiumDialog } from "../../utils/events";
import { MenuItemsList } from "../../utils/menu-items";
import ReorderableList from "../list/reorderable-list";
import { Button } from "../ui/button";
import { ColorSection } from "./color-section";
import { useSideBarDraggingStore } from "./dragging-store";
import { MenuItem } from "./menu-item";
import { PinnedSection } from "./pinned-section";
import { UserStatus } from "./user-status";
import { strings } from "@notesnook/intl";

export const SideMenu = React.memo(
  function SideMenu() {
    const { colors, isDark } = useThemeColors();
    const insets = useGlobalSafeAreaInsets();
    const subscriptionType = useUserStore(
      (state) => state.user?.subscription?.type
    );
    const isAppLoading = useSettingStore((state) => state.isAppLoading);
    const dragging = useSideBarDraggingStore((state) => state.dragging);
    const [order, hiddensItems] = useMenuStore((state) => [
      state.order["routes"],
      state.hiddenItems["routes"]
    ]);

    const introCompleted = useSettingStore(
      (state) => state.settings.introCompleted
    );

    const pro = {
      name: "Notesnook Pro",
      icon: "crown",
      func: () => {
        eSendEvent(eOpenPremiumDialog);
      }
    };

    const renderItem = useCallback(
      () => (
        <>
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
            showsVerticalScrollIndicator={false}
            renderDraggableItem={({ item, index }) => {
              return (
                <MenuItem
                  key={item.name}
                  item={{
                    ...item,
                    title:
                      strings.routes[
                        item.name as keyof typeof strings.routes
                      ]?.() || item.name
                  }}
                  testID={item.name}
                  index={index}
                />
              );
            }}
          />
          <ColorSection />
          <PinnedSection />
        </>
      ),
      [order, hiddensItems]
    );

    return !isAppLoading && introCompleted ? (
      <View
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: colors.primary.background
        }}
      >
        <View
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: colors.primary.background,
            paddingTop: insets.top
          }}
        >
          <DraxProvider>
            <DraxScrollView nestedScrollEnabled={false}>
              {renderItem()}
            </DraxScrollView>
          </DraxProvider>

          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            {subscriptionType === SUBSCRIPTION_STATUS.TRIAL ||
            subscriptionType === SUBSCRIPTION_STATUS.BASIC ? (
              <MenuItem testID={pro.name} key={pro.name} item={pro} index={0} />
            ) : null}
          </View>

          {dragging ? (
            <View
              style={{
                paddingHorizontal: 12
              }}
            >
              <Button
                type="secondaryAccented"
                style={{
                  flexDirection: "row",
                  borderRadius: 5,
                  marginBottom: 12,
                  justifyContent: "flex-start",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  marginTop: 5,
                  paddingVertical: 6,
                  width: "100%"
                }}
                icon="close"
                title={strings.stopReordering()}
                onPress={() => {
                  useSideBarDraggingStore.setState({
                    dragging: false
                  });
                }}
              />
            </View>
          ) : (
            <UserStatus />
          )}
        </View>
      </View>
    ) : null;
  },
  () => true
);
