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

import { Tag, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect } from "react";
import { View } from "react-native";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { db } from "../../common/database";
import { useDBItem, useTotalNotes } from "../../hooks/use-db-item";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { TaggedNotes } from "../../screens/notes/tagged";
import useNavigationStore from "../../stores/use-navigation-store";
import { useTags } from "../../stores/use-tag-store";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Properties } from "../properties";
import AppIcon from "../ui/AppIcon";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHeader } from "./side-menu-header";
import { useSideMenuTagsSelectionStore } from "./stores";

const TagItem = (props: {
  tags: VirtualizedGrouping<Tag>;
  id: number | string;
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(props.id, "tag", props.tags);
  const isSelected = useSideMenuTagsSelectionStore((state) =>
    item?.id ? state.selection[item.id] === "selected" : false
  );
  const enabled = useSideMenuTagsSelectionStore((state) => state.enabled);
  const isFocused = useNavigationStore(
    (state) => state.focusedRouteId === item?.id
  );
  const totalNotes = useTotalNotes("tag");
  const totalNotesRef = React.useRef(totalNotes);
  totalNotesRef.current = totalNotes;

  useEffect(() => {
    if (item?.id) {
      totalNotesRef.current?.getTotalNotes([item?.id]);
    }
  }, [item]);

  return item ? (
    <Pressable
      type={isSelected || isFocused ? "selected" : "transparent"}
      onLongPress={() => {
        Properties.present(item);
      }}
      testID={`tag-item-${props.id}`}
      onPress={() => {
        if (enabled) {
          useSideMenuTagsSelectionStore
            .getState()
            .markAs(item, isSelected ? "deselected" : "selected");
          if (
            useSideMenuTagsSelectionStore.getState().getSelectedItemIds()
              .length === 0
          ) {
            useSideMenuTagsSelectionStore.setState({
              enabled: false
            });
          }
        } else {
          TaggedNotes.navigate(item, false);
        }
      }}
      style={{
        justifyContent: "space-between",
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        borderRadius: 5,
        paddingRight: DefaultAppStyles.GAP_SMALL
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
            width: 32,
            height: 32,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <AppIcon
            size={SIZE.md}
            color={isFocused ? colors.selected.icon : colors.secondary.icon}
            name="pound"
          />
        </View>

        <Paragraph
          color={
            isFocused ? colors.selected.paragraph : colors.secondary.paragraph
          }
          size={SIZE.xs}
        >
          {item?.title}
        </Paragraph>
      </View>

      {enabled ? (
        <View
          style={{
            width: 22,
            height: 22,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <AppIcon
            name={isSelected ? "checkbox-outline" : "checkbox-blank-outline"}
            color={isSelected ? colors.selected.icon : colors.primary.icon}
          />
        </View>
      ) : (
        <>
          {item?.id && totalNotes.totalNotes?.(item?.id) ? (
            <Paragraph size={SIZE.xxs} color={colors.secondary.paragraph}>
              {totalNotes.totalNotes(item?.id)}
            </Paragraph>
          ) : null}
        </>
      )}
    </Pressable>
  ) : null;
};

export const SideMenuTags = () => {
  const [tags] = useTags();
  const insets = useGlobalSafeAreaInsets();

  useEffect(() => {
    useSideMenuTagsSelectionStore.setState({
      selectAll: async () => {
        const tags = await db.tags.all.items();
        const allSelected = tags.every((tag) => {
          return (
            useSideMenuTagsSelectionStore.getState().selection[tag.id] ===
            "selected"
          );
        });

        if (allSelected) {
          useSideMenuTagsSelectionStore.getState().setSelection({});
        } else {
          useSideMenuTagsSelectionStore.getState().setSelection(
            tags.reduce((acc: any, tag) => {
              acc[tag.id] = "selected";
              return acc;
            }, {})
          );
        }
      }
    });
  }, []);

  const renderItem = React.useCallback(
    (info: { index: number }) => {
      return <TagItem id={info.index} tags={tags!} />;
    },
    [tags]
  );

  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingTop: DefaultAppStyles.GAP_SMALL,
        width: "100%",
        height: "100%"
      }}
    >
      <SideMenuHeader />
      <FlashList
        data={tags?.placeholders}
        estimatedItemSize={32}
        renderItem={renderItem}
      />
    </View>
  );
};
