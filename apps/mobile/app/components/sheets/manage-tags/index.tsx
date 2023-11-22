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
import { Tags } from "@notesnook/core/dist/collections/tags";
import { Note, Tag } from "@notesnook/core/dist/types";
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
import {
  ActionSheetRef,
  FlashList,
  FlatList
} from "react-native-actions-sheet";
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
import { SIZE } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import { PressableButton } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

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
  notes?: Note[];
  actionSheetRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const notes = useMemo(() => props.notes || [], [props.notes]);
  const [tags, setTags] = useState<VirtualizedGrouping<Tag>>();
  const [query, setQuery] = useState<string>();
  const inputRef = useRef<TextInput>(null);
  const [focus, setFocus] = useState(false);
  const [queryExists, setQueryExists] = useState(false);
  const dimensions = useWindowDimensions();
  const refreshSelection = useCallback(() => {
    const ids = notes.map((item) => item.id);
    updateInitialSelectionState(ids).then((selection) => {
      useTagItemSelection.setState({
        initialState: selection,
        selection: { ...selection }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, tags]);

  const refreshTags = useCallback(() => {
    if (query && query.trim() !== "") {
      db.lookup.tags(query).then((items) => {
        setTags(items);
        console.log("searched tags");
      });
    } else {
      db.tags.all.sorted(db.settings.getGroupOptions("tags")).then((items) => {
        console.log("items loaded tags");
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
      ToastManager.show({
        heading: "Tag field is empty",
        type: "error",
        context: "local"
      });
      return;
    }

    const tag = query;
    setQuery(undefined);
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
        for (const note of notes) {
          await db.relations.add(
            {
              id: id,
              type: "tag"
            },
            note
          );
        }
      }

      useRelationStore.getState().update();
      useTagStore.getState().setTags();
      refreshTags();
    } catch (e) {
      ToastManager.show({
        heading: "Cannot add tag",
        type: "error",
        message: (e as Error).message,
        context: "local"
      });
    }

    Navigation.queueRoutesForUpdate();
  };

  const onPress = useCallback(
    async (id: string) => {
      for (const note of notes) {
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
              note
            );
          } else {
            await db.relations.add(
              {
                id: id,
                type: "tag"
              },
              note
            );
          }
        } catch (e) {
          console.error(e);
        }
      }
      useTagStore.getState().setTags();
      useRelationStore.getState().update();
      refreshTags();
      setTimeout(() => {
        Navigation.queueRoutesForUpdate();
      }, 1);
      refreshSelection();
    },
    [notes, refreshSelection, refreshTags]
  );

  const renderTag = useCallback(
    ({ item }: { item: string; index: number }) => (
      <TagItem
        key={item as string}
        tags={tags as VirtualizedGrouping<Tag>}
        id={item as string}
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
          size: SIZE.lg,
          onPress: () => {}
        }}
        testID="tag-input"
        fwdRef={inputRef}
        autoCapitalize="none"
        onChangeText={(v) => {
          setQuery(Tags.sanitize(v));
          checkQueryExists(Tags.sanitize(v));
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
        placeholder="Search or add a tag"
      />

      {query && !queryExists ? (
        <PressableButton
          key={"query_item"}
          customStyle={{
            flexDirection: "row",
            marginVertical: 5,
            justifyContent: "space-between",
            padding: 12
          }}
          onPress={onSubmit}
          type="selected"
        >
          <Heading size={SIZE.sm} color={colors.selected.heading}>
            Add {'"' + "#" + query + '"'}
          </Heading>
          <Icon name="plus" color={colors.selected.icon} size={SIZE.lg} />
        </PressableButton>
      ) : null}

      <FlatList
        data={tags?.ids?.filter((id) => typeof id === "string") as string[]}
        style={{
          width: "100%"
        }}
        keyboardShouldPersistTaps
        keyboardDismissMode="interactive"
        keyExtractor={(item) => item as string}
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
              You do not have any tags.
            </Paragraph>
          </View>
        }
        ListFooterComponent={<View style={{ height: 50 }} />}
      />
    </View>
  );
};

ManageTagsSheet.present = (notes?: Note[]) => {
  presentSheet({
    component: (ref) => {
      return <ManageTagsSheet actionSheetRef={ref} notes={notes} />;
    }
  });
};

export default ManageTagsSheet;

const TagItem = ({
  id,
  tags,
  onPress
}: {
  id: string;
  tags: VirtualizedGrouping<Tag>;
  onPress: (id: string) => void;
}) => {
  const { colors } = useThemeColors();
  const [tag] = useDBItem(id, "tag", tags);
  const selection = useTagItemSelection((state) => state.selection[id]);

  return (
    <PressableButton
      customStyle={{
        flexDirection: "row",
        marginVertical: 5,
        justifyContent: "flex-start",
        height: 40
      }}
      onPress={() => onPress(id)}
      type="gray"
    >
      {!tag ? null : (
        <Icon
          size={22}
          onPress={() => onPress(id)}
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
        <Paragraph size={SIZE.sm}>{"#" + tag?.title}</Paragraph>
      ) : (
        <View
          style={{
            width: 200,
            height: 30,
            // backgroundColor: colors.secondary.background,
            borderRadius: 5
          }}
        />
      )}
    </PressableButton>
  );
};
