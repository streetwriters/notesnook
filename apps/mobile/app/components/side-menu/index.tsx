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
import { FlatList, View } from "react-native";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { DDS } from "../../services/device-detection";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import { eOpenPremiumDialog } from "../../utils/events";
import { MenuItemsList } from "../../utils/menu-items";
import { SIZE } from "../../utils/size";
import ReorderableList from "../list/reorderable-list";
import { IconButton } from "../ui/icon-button";
import Paragraph from "../ui/typography/paragraph";
import { ColorSection } from "./color-section";
import { useSideBarDraggingStore } from "./dragging-store";
import { MenuItem } from "./menu-item";
import { PinnedSection } from "./pinned-section";
import { UserStatus } from "./user-status";

export const SideMenu = React.memo(
  function SideMenu() {
    const { colors, isDark } = useThemeColors();
    const insets = useGlobalSafeAreaInsets();
    const subscriptionType = useUserStore(
      (state) => state.user?.subscription?.type
    );
    const isAppLoading = useSettingStore((state) => state.isAppLoading);
    const dragging = useSideBarDraggingStore((state) => state.dragging);

    const introCompleted = useSettingStore(
      (state) => state.settings.introCompleted
    );
    const BottomItemsList = [
      {
        name: isDark ? "Day" : "Night",
        icon: "theme-light-dark",
        func: () => {
          useThemeStore.getState().setColorScheme();
        },
        switch: true,
        on: !!isDark,
        close: false
      },
      {
        name: "Settings",
        icon: "cog-outline",
        close: true,
        func: () => {
          Navigation.navigate("Settings");
        }
      }
    ];

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
            itemOrder={db.settings.getSideBarOrder("routes")}
            hiddenItems={db.settings.getSideBarHiddenItems("routes")}
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
                  item={item}
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
      []
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
          {dragging ? (
            <View
              style={{
                flexDirection: "row",
                borderRadius: 5,
                marginBottom: 12,
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 12,
                backgroundColor: colors.secondary.background,
                marginHorizontal: 12,
                marginTop: 5,
                paddingVertical: 6
              }}
            >
              <Paragraph size={SIZE.sm}>REORDERING</Paragraph>

              <IconButton
                name="close"
                size={20}
                onPress={() => {
                  useSideBarDraggingStore.setState({
                    dragging: false
                  });
                }}
                color={colors.primary.icon}
                customStyle={{
                  width: 35,
                  height: 35
                }}
              />
            </View>
          ) : null}

          <FlatList
            alwaysBounceVertical={false}
            contentContainerStyle={{
              flexGrow: 1
            }}
            showsVerticalScrollIndicator={false}
            data={[0]}
            keyExtractor={() => "mainMenuView"}
            renderItem={renderItem}
          />
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            {subscriptionType === SUBSCRIPTION_STATUS.TRIAL ||
            subscriptionType === SUBSCRIPTION_STATUS.BASIC ? (
              <MenuItem testID={pro.name} key={pro.name} item={pro} index={0} />
            ) : null}

            {BottomItemsList.slice(DDS.isLargeTablet() ? 0 : 1, 3).map(
              (item, index) => (
                <MenuItem
                  testID={
                    item.name == "Night mode"
                      ? notesnook.ids.menu.nightmode
                      : item.name
                  }
                  key={item.name}
                  item={item}
                  index={index}
                  rightBtn={
                    DDS.isLargeTablet() || item.name === "Notesnook Pro"
                      ? undefined
                      : BottomItemsList[0]
                  }
                />
              )
            )}
          </View>

          <View
            style={{
              width: "100%",
              paddingHorizontal: 0
            }}
          >
            <UserStatus />
          </View>
        </View>
      </View>
    ) : null;
  },
  () => true
);
