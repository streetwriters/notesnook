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
import { View } from "react-native";
import { db } from "../../common/database";
import { ColoredNotes } from "../../screens/notes/colored";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { SIZE, normalize } from "../../utils/size";
import { presentDialog } from "../dialog/functions";
import { PressableButton } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Color } from "@notesnook/core";
import ReorderableList from "../list/reorderable-list";

export const ColorSection = React.memo(
  function ColorSection() {
    const colorNotes = useMenuStore((state) => state.colorNotes);
    const loading = useNoteStore((state) => state.loading);
    const setColorNotes = useMenuStore((state) => state.setColorNotes);

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
        itemOrder={db.settings.getSideBarOrder("colors")}
        hiddenItems={db.settings.getSideBarHiddenItems("colors")}
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
    const setColorNotes = useMenuStore((state) => state.setColorNotes);
    const [headerTextState, setHeaderTextState] = useState<{
      id: string | undefined;
    }>({
      id: undefined
    });
    const isFocused = headerTextState?.id === item.id;

    const onHeaderStateChange = useCallback(
      (state: any) => {
        setTimeout(() => {
          const id = state.focusedRouteId;
          if (id === item.id) {
            setHeaderTextState({ id: state.currentScreen.id });
          } else {
            if (headerTextState !== null) {
              setHeaderTextState({ id: undefined });
            }
          }
        }, 300);
      },
      [headerTextState, item.id]
    );

    useEffect(() => {
      const remove = useNavigationStore.subscribe(onHeaderStateChange);
      return () => {
        remove();
      };
    }, [headerTextState, onHeaderStateChange]);

    const onPress = (item: Color) => {
      ColoredNotes.navigate(item, false);

      setImmediate(() => {
        Navigation.closeDrawer();
      });
    };

    const onLongPress = () => {
      presentDialog({
        title: "Rename color",
        input: true,
        inputPlaceholder: "Enter name for this color",
        defaultValue: item.title,
        paragraph: "You are renaming the color " + item.title,
        positivePress: async (value) => {
          if (!value || value.trim().length === 0) return;
          await db.colors.add({
            id: item.id,
            title: value
          });
          setColorNotes();
        },
        positiveText: "Rename"
      });
    };

    return (
      <PressableButton
        customColor={isFocused ? "rgba(0,0,0,0.04)" : "transparent"}
        onLongPress={onLongPress}
        customSelectedColor={item.colorCode}
        customAlpha={!isDark ? -0.02 : 0.02}
        customOpacity={0.12}
        onPress={() => onPress(item)}
        customStyle={{
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
              {item.title?.slice(0, 1).toUpperCase() + item.title.slice(1)}
            </Heading>
          ) : (
            <Paragraph color={colors.primary.paragraph} size={SIZE.md}>
              {item.title?.slice(0, 1).toUpperCase() + item.title.slice(1)}
            </Paragraph>
          )}
        </View>
      </PressableButton>
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
