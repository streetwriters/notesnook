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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect } from "react";
import { TextInput, View } from "react-native";
import { DatabaseLogger, db } from "../../common/database";
import { useDBItem, useTotalNotes } from "../../hooks/use-db-item";
import { TaggedNotes } from "../../screens/notes/tagged";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useTags } from "../../stores/use-tag-store";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Properties } from "../properties";
import AppIcon from "../ui/AppIcon";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHeader } from "./side-menu-header";
import { SideMenuListEmpty } from "./side-menu-list-empty";
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

  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        marginTop:
          (props.id as number) === 0 ? DefaultAppStyles.GAP_VERTICAL : 2
      }}
    >
      {item ? (
        <Pressable
          type={isSelected || isFocused ? "selected" : "transparent"}
          onLongPress={() => {
            Properties.present(item, false, [
              {
                id: "select",
                title: strings.select() + " " + strings.dataTypes["tag"](),
                icon: "checkbox-outline",
                onPress: () => {
                  const store = useSideMenuTagsSelectionStore;
                  store.setState({
                    enabled: true,
                    selection: {}
                  });
                  store.getState().markAs(item, "selected");
                }
              }
            ]);
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
              Navigation.closeDrawer();
            }
          }}
          style={{
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
            flexDirection: "row",
            borderRadius: defaultBorderRadius,
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
                size={AppFontSize.md}
                color={isFocused ? colors.selected.icon : colors.primary.icon}
                name="pound"
              />
            </View>

            <Paragraph
              color={
                isFocused ? colors.selected.paragraph : colors.primary.paragraph
              }
              size={AppFontSize.sm}
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
                name={
                  isSelected ? "checkbox-outline" : "checkbox-blank-outline"
                }
                color={isSelected ? colors.selected.icon : colors.primary.icon}
              />
            </View>
          ) : (
            <>
              {item?.id && totalNotes.totalNotes?.(item?.id) ? (
                <Paragraph
                  size={AppFontSize.xxs}
                  color={colors.secondary.paragraph}
                >
                  {totalNotes.totalNotes(item?.id)}
                </Paragraph>
              ) : null}
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
};

export const SideMenuTags = () => {
  const [tags, isLoading] = useTags();
  const { colors } = useThemeColors();
  const [filteredTags, setFilteredTags] = React.useState(tags);
  const [loading, setLoading] = React.useState(true);
  const searchTimer = React.useRef<NodeJS.Timeout>();
  const lastQuery = React.useRef<string>();

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

  const updateTags = React.useCallback(() => {
    if (lastQuery.current) {
      db.lookup
        .tags(lastQuery.current.trim())
        .sorted()
        .then(async (filtered) => {
          setFilteredTags(filtered);
        });
    } else {
      setFilteredTags(tags);
    }
    setLoading(false);
  }, [tags]);

  useEffect(() => {
    if (!isLoading) {
      updateTags();
    }
  }, [updateTags, isLoading]);

  const renderItem = React.useCallback(
    (info: { index: number }) => {
      return <TagItem id={info.index} tags={filteredTags!} />;
    },
    [filteredTags]
  );
  return (
    <View
      style={{
        width: "100%",
        height: "100%"
      }}
    >
      {!tags || tags?.placeholders.length === 0 ? (
        <SideMenuListEmpty
          placeholder={strings.emptyPlaceholders("tag")}
          isLoading={loading}
        />
      ) : (
        <>
          <FlashList
            data={filteredTags?.placeholders}
            bounces={false}
            estimatedItemSize={35}
            bouncesZoom={false}
            overScrollMode="never"
            ListHeaderComponent={
              <View
                style={{
                  backgroundColor: colors.primary.background,
                  paddingTop: DefaultAppStyles.GAP_VERTICAL
                }}
              >
                <SideMenuHeader />
              </View>
            }
            renderItem={renderItem}
          />
          <View
            style={{
              width: "100%",
              paddingHorizontal: DefaultAppStyles.GAP,
              backgroundColor: colors.primary.background,
              borderTopColor: colors.primary.border,
              borderTopWidth: 1,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            <TextInput
              placeholder="Filter tags..."
              style={{
                fontFamily: "Inter-Regular",
                fontSize: AppFontSize.xs,
                paddingTop: 0,
                paddingBottom: 0
              }}
              cursorColor={colors.primary.accent}
              onChangeText={async (value) => {
                searchTimer.current && clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(async () => {
                  try {
                    lastQuery.current = value;
                    updateTags();
                  } catch (e) {
                    DatabaseLogger.error(e);
                  }
                }, 500);
              }}
              placeholderTextColor={colors.primary.placeholder}
            />
          </View>
        </>
      )}
    </View>
  );
};
