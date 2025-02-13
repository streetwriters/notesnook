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

import { VirtualizedGrouping } from "@notesnook/core";
import { sanitizeTag } from "@notesnook/core";
import { Tag } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { TextInput, View, useWindowDimensions } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import { useDBItem } from "../../../hooks/use-db-item";
import { ToastManager, presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import {
  ItemSelection,
  createItemSelectionStore
} from "../../../stores/item-selection-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import Input from "../../ui/input";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

async function updateInitialSelectionState(items: string[]) {
  const relations = await db.relations
    .to(
      {
        type: "note",
        ids: items
      },
      "tag"
    )
    .get();

  const initialSelectionState: ItemSelection = {};
  const tagId = [...new Set(relations.map((relation) => relation.fromId))];

  for (const id of tagId) {
    const all = items.every((noteId) => {
      return (
        relations.findIndex(
          (relation) => relation.fromId === id && relation.toId === noteId
        ) > -1
      );
    });
    if (all) {
      initialSelectionState[id] = "selected";
    } else {
      initialSelectionState[id] = "intermediate";
    }
  }

  return initialSelectionState;
}

const useTagItemSelection = createItemSelectionStore(true);

const ManageTagsSheet = (props: {
  ids?: string[];
  actionSheetRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const ids = useMemo(() => props.ids || [], [props.ids]);
  const [tags, setTags] = useState<VirtualizedGrouping<Tag>>();
  const [query, setQuery] = useState<string>();
  const inputRef = useRef<TextInput>(null);
  const [focus, setFocus] = useState(false);
  const [queryExists, setQueryExists] = useState(false);
  const dimensions = useWindowDimensions();
  const refreshSelection = useCallback(() => {
    updateInitialSelectionState(ids).then((selection) => {
      useTagItemSelection.setState({
        initialState: selection,
        selection: { ...selection }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, tags]);

  const refreshTags = useCallback(() => {
    if (query && query.trim() !== "") {
      db.lookup
        .tags(query)
        .sorted()
        .then((items) => {
          setTags(items);
        });
    } else {
      db.tags.all.sorted(db.settings.getGroupOptions("tags")).then((items) => {
        setTags(items);
      });
    }
  }, [query]);

  useEffect(() => {
    refreshTags();
  }, [refreshTags, query]);

  useEffect(() => {
    refreshSelection();
  }, [refreshSelection]);

  const checkQueryExists = (query: string) => {
    db.tags.all
      .find((v) => v.and([v(`title`, "==", query)]))
      .then((exists) => setQueryExists(!!exists));
  };

  const onSubmit = async () => {
    if (!query || query === "" || query.trimStart().length == 0) {
      return;
    }

    const tag = query;
    inputRef.current?.setNativeProps({
      text: ""
    });

    try {
      const exists = await db.tags.all.find((v) =>
        v.and([v(`title`, "==", tag)])
      );

      const id = exists
        ? exists?.id
        : await db.tags.add({
            title: tag
          });

      if (id) {
        for (const noteId of ids) {
          await db.relations.add(
            {
              id: id,
              type: "tag"
            },
            {
              id: noteId,
              type: "note"
            }
          );
        }
      }

      useRelationStore.getState().update();
      useTagStore.getState().refresh();
      setQuery(undefined);
    } catch (e) {
      ToastManager.error(e as Error);
    }

    Navigation.queueRoutesForUpdate();
  };

  const onPress = useCallback(
    async (id: string) => {
      for (const noteId of ids) {
        try {
          if (!id) return;
          const isSelected =
            useTagItemSelection.getState().initialState[id] === "selected";
          if (isSelected) {
            await db.relations.unlink(
              {
                id: id,
                type: "tag"
              },
              {
                id: noteId,
                type: "note"
              }
            );
          } else {
            await db.relations.add(
              {
                id: id,
                type: "tag"
              },
              {
                id: noteId,
                type: "note"
              }
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
      useTagStore.getState().refresh();
      useRelationStore.getState().update();
      refreshTags();
      setTimeout(() => {
        Navigation.queueRoutesForUpdate();
      }, 1);
      refreshSelection();
    },
    [ids, refreshSelection, refreshTags]
  );

  const renderTag = useCallback(
    ({ index }: { item: boolean; index: number }) => (
      <TagItem
        tags={tags as VirtualizedGrouping<Tag>}
        id={index}
        onPress={onPress}
      />
    ),
    [onPress, tags]
  );

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12,
        maxHeight: dimensions.height * 0.85
      }}
    >
      <Input
        button={{
          icon: "magnify",
          color: colors.primary.accent,
          size: AppFontSize.lg,
          onPress: () => {}
        }}
        testID="tag-input"
        fwdRef={inputRef}
        autoCapitalize="none"
        onChangeText={(v) => {
          setQuery(sanitizeTag(v));
          checkQueryExists(sanitizeTag(v));
        }}
        onFocusInput={() => {
          setFocus(true);
        }}
        onBlurInput={() => {
          setFocus(false);
        }}
        onSubmit={() => {
          onSubmit();
        }}
        placeholder={strings.searchForTags()}
      />

      {query && !queryExists ? (
        <Pressable
          key={"query_item"}
          style={{
            flexDirection: "row",
            marginVertical: 5,
            justifyContent: "space-between",
            padding: 12
          }}
          onPress={onSubmit}
          type="selected"
        >
          <Heading size={AppFontSize.sm} color={colors.selected.heading}>
            {strings.add()} {'"' + "#" + query + '"'}
          </Heading>
          <Icon
            name="plus"
            color={colors.selected.icon}
            size={AppFontSize.lg}
          />
        </Pressable>
      ) : null}

      <View
        style={{
          width: "100%",
          flexGrow: 1,
          height: "100%"
        }}
      >
        <FlashList
          data={tags?.placeholders}
          keyboardShouldPersistTaps
          keyboardDismissMode="interactive"
          estimatedItemSize={50}
          renderItem={renderTag}
          ListEmptyComponent={
            <View
              style={{
                width: "100%",
                height: 200,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Heading size={50} color={colors.secondary.heading}>
                #
              </Heading>
              <Paragraph
                textBreakStrategy="balanced"
                color={colors.secondary.paragraph}
              >
                {strings.emptyPlaceholders("tag")}
              </Paragraph>
            </View>
          }
          ListFooterComponent={<View style={{ height: 50 }} />}
        />
      </View>
    </View>
  );
};

ManageTagsSheet.present = (ids?: string[]) => {
  presentSheet({
    component: (ref) => {
      return <ManageTagsSheet actionSheetRef={ref} ids={ids} />;
    }
  });
};

export default ManageTagsSheet;

const TagItem = ({
  id,
  tags,
  onPress
}: {
  id: string | number;
  tags: VirtualizedGrouping<Tag>;
  onPress: (id: string) => void;
}) => {
  const { colors } = useThemeColors();
  const [tag] = useDBItem(id, "tag", tags);
  const selection = useTagItemSelection((state) =>
    tag?.id ? state.selection[tag?.id] : false
  );

  return !tag ? null : (
    <Pressable
      key={tag?.id}
      style={{
        flexDirection: "row",
        marginVertical: 5,
        justifyContent: "flex-start",
        height: 40
      }}
      onPress={() => {
        if (!tag) return;
        onPress(tag.id);
      }}
      type="plain"
    >
      {!tag ? null : (
        <Icon
          size={22}
          onPress={() => {
            if (!tag) return;
            onPress(tag.id);
          }}
          color={
            selection === "selected" || selection === "intermediate"
              ? colors.selected.icon
              : colors.primary.icon
          }
          style={{
            marginRight: 6
          }}
          testID={
            selection === "selected"
              ? "check-circle-outline"
              : selection === "intermediate"
              ? "minus-circle-outline"
              : "checkbox-blank-circle-outline"
          }
          name={
            selection === "selected"
              ? "check-circle-outline"
              : selection === "intermediate"
              ? "minus-circle-outline"
              : "checkbox-blank-circle-outline"
          }
        />
      )}
      {tag ? (
        <Paragraph size={AppFontSize.sm}>{"#" + tag?.title}</Paragraph>
      ) : (
        <View
          style={{
            width: 200,
            height: 30,
            borderRadius: defaultBorderRadius
          }}
        />
      )}
    </Pressable>
  );
};
