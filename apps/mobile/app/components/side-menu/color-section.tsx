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

import { Color } from "@notesnook/core";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { ColoredNotes } from "../../screens/notes/colored";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { SideMenuItem } from "../../utils/menu-items";
import ReorderableList from "../list/reorderable-list";
import { Properties } from "../properties";
import { useSideBarDraggingStore } from "./dragging-store";
import { MenuItem } from "./menu-item";

export const ColorSection = React.memo(
  function ColorSection() {
    const [colorNotes] = useMenuStore((state) => [
      state.colorNotes,
      state.loadingColors
    ]);
    const loading = useSettingStore((state) => state.isAppLoading);
    const setColorNotes = useMenuStore((state) => state.setColorNotes);
    const [order, hiddensItems] = useMenuStore((state) => [
      state.order["colors"],
      state.hiddenItems["colors"]
    ]);

    useEffect(() => {
      if (!loading) {
        setColorNotes();
      }
    }, [loading, setColorNotes]);

    const onPress = React.useCallback((item: SideMenuItem) => {
      ColoredNotes.navigate(item.data as Color, false);
      setImmediate(() => {
        Navigation.closeDrawer();
      });
    }, []);

    const onLongPress = React.useCallback((item: SideMenuItem) => {
      if (useSideBarDraggingStore.getState().dragging) return;
      Properties.present(item.data as Color);
    }, []);

    const renderIcon = React.useCallback((item: SideMenuItem, size: number) => {
      return (
        <View
          style={{
            width: size,
            height: size,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <View
            style={{
              width: size - 5,
              height: size - 5,
              backgroundColor: (item.data as Color).colorCode,
              borderRadius: 100
            }}
          />
        </View>
      );
    }, []);

    const menuItems = useMemo(
      () =>
        colorNotes.map((item) => ({
          id: item.id,
          title: item.title,
          icon: "circle",
          dataType: "color",
          data: item,
          onPress: onPress,
          onLongPress: onLongPress
        })) as SideMenuItem[],
      [colorNotes, onPress, onLongPress]
    );

    return (
      <ReorderableList
        onListOrderChanged={(data) => {
          db.settings.setSideBarOrder("colors", data);
        }}
        onHiddenItemsChanged={(data) => {
          db.settings.setSideBarHiddenItems("colors", data);
        }}
        disableDefaultDrag={true}
        itemOrder={order}
        hiddenItems={hiddensItems}
        alwaysBounceVertical={false}
        data={menuItems}
        style={{
          width: "100%"
        }}
        showsVerticalScrollIndicator={false}
        renderDraggableItem={({ item }) => {
          return <MenuItem item={item} renderIcon={renderIcon} />;
        }}
      />
    );
  },
  () => true
);
