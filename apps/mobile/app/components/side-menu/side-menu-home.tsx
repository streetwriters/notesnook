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
import React, { Fragment } from "react";
import { FlatList, View } from "react-native";
import { DraxProvider, DraxScrollView } from "react-native-drax";
import { db } from "../../common/database";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { MenuItemsList } from "../../utils/menu-items";
import { DefaultAppStyles } from "../../utils/styles";
import ReorderableList from "../list/reorderable-list";
import { ColorSection } from "./color-section";
import { MenuItem } from "./menu-item";
import { PinnedSection } from "./pinned-section";
import { SideMenuHeader } from "./side-menu-header";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import { eSendEvent } from "../../services/event-manager";
import { eOpenPremiumDialog } from "../../utils/events";
import { useUserStore } from "../../stores/use-user-store";
import { Button } from "../ui/button";
import { MenuItemProperties } from "../sheets/menu-item-properties";

const pro = {
  title: strings.getNotesnookPro(),
  icon: "crown",
  id: "pro",
  onPress: () => {
    eSendEvent(eOpenPremiumDialog);
  }
};

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
  const subscriptionType = useUserStore(
    (state) => state.user?.subscription?.type
  );

  return (
    <View
      style={{
        height: "100%",
        width: "100%",
        backgroundColor: colors.primary.background,
        gap: DefaultAppStyles.GAP,
        paddingTop: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <SideMenuHeader />

      {!isAppLoading && introCompleted ? (
        <DraxProvider>
          <FlatList
            renderScrollComponent={(props) => <DraxScrollView {...props} />}
            data={[0]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            keyExtractor={() => "scroll-items"}
            renderItem={() => (
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
                  disableDefaultDrag
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
                            ]?.() || item.title,
                          onLongPress: () => {
                            MenuItemProperties.present(item);
                          }
                        }}
                        testID={item.title}
                        index={index}
                      />
                    );
                  }}
                />
                <ColorSection />
                <PinnedSection />
              </>
            )}
            style={{
              paddingHorizontal: DefaultAppStyles.GAP
            }}
            nestedScrollEnabled={false}
          />
        </DraxProvider>
      ) : null}

      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        {subscriptionType === SUBSCRIPTION_STATUS.TRIAL ||
        subscriptionType === SUBSCRIPTION_STATUS.BASIC ? (
          <Button
            title={pro.title}
            iconColor={colors.static.yellow}
            textStyle={{
              color: colors.static.white
            }}
            icon={pro.icon}
            style={{
              backgroundColor: colors.static.black,
              width: "100%"
            }}
            onPress={pro.onPress}
          />
        ) : null}
      </View>
    </View>
  );
}
