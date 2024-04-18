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
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { ColoredNotes } from "../../screens/notes/colored";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE, normalize } from "../../utils/size";
import ReorderableList from "../list/reorderable-list";
import { Properties } from "../properties";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { useSideBarDraggingStore } from "./dragging-store";

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
        data={colorNotes}
        style={{
          width: "100%"
        }}
        showsVerticalScrollIndicator={false}
        renderDraggableItem={({ item }) => {
          return <ColorItem key={item.id} item={item} />;
        }}
      />
    );
  },
  () => true
);

const ColorItem = React.memo(
  function ColorItem({ item }: { item: Color }) {
    const { colors, isDark } = useThemeColors();
    const isFocused = useNavigationStore(
      (state) => state.focusedRouteId === item.id
    );

    const onPress = (item: Color) => {
      ColoredNotes.navigate(item, false);

      setImmediate(() => {
        Navigation.closeDrawer();
      });
    };

    const onLongPress = () => {
      if (useSideBarDraggingStore.getState().dragging) return;
      Properties.present(item);
    };

    return (
      <Pressable
        customColor={isFocused ? "rgba(0,0,0,0.04)" : "transparent"}
        onLongPress={onLongPress}
        customSelectedColor={item.colorCode}
        customAlpha={!isDark ? -0.02 : 0.02}
        customOpacity={0.12}
        onPress={() => onPress(item)}
        style={{
          width: "100%",
          alignSelf: "center",
          borderRadius: 5,
          flexDirection: "row",
          paddingHorizontal: 8,
          justifyContent: "space-between",
          alignItems: "center",
          height: normalize(50),
          marginBottom: 5
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <View
            style={{
              width: 30,
              justifyContent: "center",
              alignItems: "flex-start"
            }}
          >
            <View
              style={{
                width: SIZE.lg - 2,
                height: SIZE.lg - 2,
                backgroundColor: item.colorCode,
                borderRadius: 100,
                justifyContent: "center",
                marginRight: 10
              }}
            />
          </View>
          {isFocused ? (
            <Heading color={colors.selected.heading} size={SIZE.md}>
              {item.title}
            </Heading>
          ) : (
            <Paragraph color={colors.primary.paragraph} size={SIZE.md}>
              {item.title}
            </Paragraph>
          )}
        </View>
      </Pressable>
    );
  },
  (prev, next) => {
    if (!next.item) return false;
    if (prev.item?.title !== next.item.title) return false;
    if (prev.item?.dateModified !== next.item?.dateModified) return false;
    if (prev.item?.id !== next.item?.id) return false;

    return true;
  }
);
