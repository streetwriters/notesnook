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
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { useTotalNotes } from "../../hooks/use-db-item";
import Navigation from "../../services/navigation";
import { useFavoriteStore } from "../../stores/use-favorite-store";
import useNavigationStore, {
  RouteParams
} from "../../stores/use-navigation-store";
import { useNoteStore } from "../../stores/use-notes-store";
import { useTrashStore } from "../../stores/use-trash-store";
import { SideMenuItem } from "../../utils/menu-items";
import { defaultBorderRadius, AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";

function _MenuItem({
  item,
  index,
  testID,
  renderIcon
}: {
  item: SideMenuItem;
  index?: number;
  testID?: string;
  renderIcon?: (item: SideMenuItem, size: number) => React.ReactNode;
}) {
  const [itemCount, setItemCount] = useState(0);
  const { colors } = useThemeColors();
  const isFocused = useNavigationStore(
    (state) => state.focusedRouteId === item.id
  );
  const totalNotes = useTotalNotes(
    item.dataType as "notebook" | "tag" | "color"
  );
  const getTotalNotesRef = useRef(totalNotes.getTotalNotes);
  getTotalNotesRef.current = totalNotes.getTotalNotes;

  const menuItemCount = !item.data
    ? itemCount
    : totalNotes.totalNotes(item.data.id);

  useEffect(() => {
    let unsub: () => void;
    if (!item.data) {
      switch (item.id) {
        case "Notes":
          unsub = useNoteStore.subscribe((state) => {
            setItemCount(
              useNoteStore.getState().items?.placeholders?.length || 0
            );
          });
          setItemCount(
            useNoteStore.getState().items?.placeholders?.length || 0
          );
          break;
        case "Favorites":
          unsub = useFavoriteStore.subscribe((state) => {
            setItemCount(state.items?.placeholders.length || 0);
          });
          setItemCount(
            useFavoriteStore.getState().items?.placeholders?.length || 0
          );
          break;
        case "Reminders":
          unsub = useFavoriteStore.subscribe((state) => {
            setItemCount(state.items?.placeholders.length || 0);
          });
          setItemCount(
            useFavoriteStore.getState().items?.placeholders?.length || 0
          );
          break;
        case "Monographs":
          db.monographs.all.count().then((count) => {
            setItemCount(count);
          });
          // TODO make it reactive?
          break;
        case "Trash":
          unsub = useTrashStore.subscribe((state) => {
            setItemCount(state.items?.placeholders.length || 0);
          });
          setItemCount(
            useTrashStore.getState().items?.placeholders?.length || 0
          );
          break;
      }
    } else {
      getTotalNotesRef.current?.([item.data.id]);
    }
    return () => {
      unsub?.();
    };
  }, [item.data, item.id]);

  const _onPress = () => {
    if (item.onPress) return item.onPress(item);

    if (useNavigationStore.getState().currentRoute !== item.id) {
      Navigation.navigate(item.id as keyof RouteParams, {
        canGoBack: false
      });
    }
    setImmediate(() => {
      Navigation.closeDrawer();
    });
  };

  return (
    <Pressable
      testID={testID}
      key={item.id}
      onPress={_onPress}
      onLongPress={() => item.onLongPress?.(item)}
      type={isFocused ? "selected" : "plain"}
      style={{
        width: "100%",
        alignSelf: "center",
        borderRadius: defaultBorderRadius,
        flexDirection: "row",
        paddingHorizontal: DefaultAppStyles.GAP_SMALL,
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: DefaultAppStyles.GAP_VERTICAL
      }}
      onLayout={(e) => {
        console.log(e.nativeEvent.layout);
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: DefaultAppStyles.GAP_SMALL
        }}
      >
        {renderIcon ? (
          renderIcon(item, AppFontSize.md)
        ) : (
          <Icon
            style={{
              textAlignVertical: "center",
              textAlign: "left"
            }}
            allowFontScaling
            name={item.icon}
            color={
              item.icon === "crown"
                ? colors.static.yellow
                : isFocused
                ? colors.selected.paragraph
                : colors.secondary.icon
            }
            size={AppFontSize.md}
          />
        )}

        <Paragraph
          color={
            isFocused ? colors.primary.paragraph : colors.secondary.paragraph
          }
          size={AppFontSize.sm}
        >
          {item.title}
        </Paragraph>
      </View>

      {menuItemCount > 0 ? (
        <Paragraph
          size={AppFontSize.xxs}
          color={
            isFocused ? colors.primary.paragraph : colors.secondary.paragraph
          }
        >
          {menuItemCount}
        </Paragraph>
      ) : null}
    </Pressable>
  );
}

export const MenuItem = React.memo(_MenuItem, (prev, next) => {
  if (
    prev.item.id !== next.item.id &&
    prev.item.data?.dateModified !== next.item.data?.dateModified
  )
    return false;
  return true;
});
