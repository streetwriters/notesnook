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

import { Notebook, Tag } from "@notesnook/core";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import NotebookScreen from "../../screens/notebook";
import { TaggedNotes } from "../../screens/notes/tagged";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { SideMenuItem } from "../../utils/menu-items";
import ReorderableList from "../list/reorderable-list";
import { MenuItem } from "./menu-item";
import { useThemeColors } from "@notesnook/theme";
import { DefaultAppStyles } from "../../utils/styles";

export const PinnedSection = React.memo(
  function PinnedSection() {
    const { colors } = useThemeColors();
    const menuPins = useMenuStore((state) => state.menuPins);
    const loading = useSettingStore((state) => state.isAppLoading);
    const setMenuPins = useMenuStore((state) => state.setMenuPins);
    const [order] = useMenuStore((state) => [state.order["shortcuts"]]);
    useEffect(() => {
      if (!loading) {
        setMenuPins();
      }
    }, [loading, setMenuPins]);

    const onPress = React.useCallback((item: SideMenuItem) => {
      const data = item.data as Notebook | Tag;
      if (data.type === "notebook") {
        NotebookScreen.navigate(data);
      } else if (data.type === "tag") {
        TaggedNotes.navigate(data);
      }
      setImmediate(() => {
        Navigation.closeDrawer();
      });
    }, []);

    const menuItems = useMemo(
      () =>
        menuPins.map((item) => ({
          id: item.id,
          title: item.title,
          icon: item.type === "notebook" ? "notebook-outline" : "pound",
          dataType: item.type,
          data: item,
          onPress: onPress
        })) as SideMenuItem[],
      [menuPins, onPress]
    );

    const renderItem = React.useCallback(({ item }: { item: SideMenuItem }) => {
      return <MenuItem item={item} />;
    }, []);

    return (
      <View
        style={{
          flexGrow: 1,
          borderTopWidth: 1,
          borderTopColor: colors.primary.border,
          marginTop: DefaultAppStyles.GAP_SMALL,
          paddingTop: DefaultAppStyles.GAP_SMALL
        }}
      >
        <ReorderableList
          onListOrderChanged={(data) => {
            db.settings.setSideBarOrder("shortcuts", data);
          }}
          onHiddenItemsChanged={() => {}}
          canHideItems={false}
          itemOrder={order}
          hiddenItems={[]}
          alwaysBounceVertical={false}
          data={menuItems}
          style={{
            flexGrow: 1,
            width: "100%"
          }}
          contentContainerStyle={{
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
          renderDraggableItem={renderItem}
        />
      </View>
    );
  },
  () => true
);
