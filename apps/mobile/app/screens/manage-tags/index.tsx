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

import { LegendList } from "@legendapp/list";
import { isFeatureAvailable } from "@notesnook/common";
import { Tag, VirtualizedGrouping, sanitizeTag } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../common/database";
import { Radius, Spacing } from "../../common/design/spacing";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  ToastManager,
  sendItemUpdateEvent
} from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import {
  ItemSelection,
  createItemSelectionStore
} from "../../stores/item-selection-store";
import { useRelationStore } from "../../stores/use-relation-store";
import { useTagStore } from "../../stores/use-tag-store";
import { AppFontSize } from "../../utils/size";

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

const ManageTags = (props: NavigationProps<"ManageTags">) => {
  const { colors } = useThemeColors();
  const ids = React.useMemo(
    () => props.route.params.ids || [],
    [props.route.params.ids]
  );
  const [tags, setTags] = useState<Tag[]>();
  const [query, setQuery] = useState<string>();
  const inputRef = useRef<TextInput>(null);
  useNavigationFocus(props.navigation, {
    focusOnInit: true
  });
  const timerRef = useRef<NodeJS.Timeout>(undefined);
  const [queryExists, setQueryExists] = useState(false);
  const refreshSelection = useCallback(() => {
    updateInitialSelectionState(ids).then((initialState) => {
      const prev = useTagItemSelection.getState();
      const selection = { ...initialState };
      for (const id in prev.selection) {
        if (prev.selection[id] !== prev.initialState[id]) {
          selection[id] = prev.selection[id];
        }
      }
      useTagItemSelection.setState({
        initialState,
        selection
      });
    });
  }, [ids]);

  const sortAndSetTags = useCallback(
    async (items: VirtualizedGrouping<Tag>) => {
      const tags = [];
      const noteTags = [];
      const assignedTags =
        ids.length > 1
          ? []
          : await db.relations
              .to({ type: "note", id: ids[0] }, "tag")
              .resolve();

      for (let i = 0; i < items.placeholders.length; i++) {
        const item = (await items.item(i)).item;
        if (item) {
          if (assignedTags.find((tag) => tag.id === item.id)) {
            noteTags.push(item);
          } else {
            tags.push(item);
          }
        }
      }
      tags.splice(0, 0, ...noteTags);
      setTags(tags);
    },
    [ids]
  );

  useEffect(() => {
    return () => {
      useTagItemSelection.getState().reset();
    };
  }, []);

  const refreshTags = useCallback(() => {
    if (query && query.trim() !== "") {
      db.lookup
        .tags(query)
        .sorted(db.settings.getGroupOptions("tags"))
        .then(sortAndSetTags);
    } else {
      db.tags.all
        .sorted(db.settings.getGroupOptions("tags"))
        .then(sortAndSetTags);
    }
  }, [query, sortAndSetTags]);

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

      let id = exists?.id;

      if (!id) {
        const tagsFeature = await isFeatureAvailable("tags");
        if (!tagsFeature.isAllowed) {
          ToastManager.show({
            message: tagsFeature.error,
            type: "info",
            context: "local"
          });
          return;
        }
        id = await db.tags.add({
          title: tag
        });
      }

      if (id) {
        const { selection } = useTagItemSelection.getState();
        useTagItemSelection.setState({
          selection: {
            ...selection,
            [id]: "selected"
          }
        });
      }

      useTagStore.getState().refresh();
      setQuery(undefined);
    } catch (e) {
      ToastManager.error(e as Error);
    }
  };

  const onPress = useCallback((id: string) => {
    if (!id) return;
    const { selection } = useTagItemSelection.getState();
    useTagItemSelection.setState({
      selection: {
        ...selection,
        [id]: selection[id] === "selected" ? "deselected" : "selected"
      }
    });
  }, []);

  const onSave = useCallback(async () => {
    const { selection, initialState } = useTagItemSelection.getState();
    const changedIds = new Set([
      ...Object.keys(selection),
      ...Object.keys(initialState)
    ]);

    try {
      for (const id of changedIds) {
        if (selection[id] === initialState[id]) continue;

        const shouldLink = selection[id] === "selected";
        for (const noteId of ids) {
          if (shouldLink) {
            await db.relations.add(
              { id, type: "tag" },
              { id: noteId, type: "note" }
            );
          } else {
            await db.relations.unlink(
              { id, type: "tag" },
              { id: noteId, type: "note" }
            );
          }
        }
        sendItemUpdateEvent(id, "tag");
      }

      useTagStore.getState().refresh();
      useRelationStore.getState().update();
      Navigation.queueRoutesForUpdate();
      Navigation.goBack();
    } catch (e) {
      ToastManager.error(e as Error);
    }
  }, [ids]);

  const renderTag = useCallback(
    ({ item }: { item: Tag; index: number }) => (
      <TagItem tag={item} onPress={onPress} />
    ),
    [onPress]
  );

  const hasChanges = useTagItemSelection((state) => {
    const norm = (v?: string) =>
      v === "selected" ? "s" : v === "intermediate" ? "i" : "n";
    const changedIds = new Set([
      ...Object.keys(state.selection),
      ...Object.keys(state.initialState)
    ]);
    for (const id of changedIds) {
      if (norm(state.selection[id]) !== norm(state.initialState[id])) {
        return true;
      }
    }
    return false;
  });

  return (
    <SafeAreaView
      style={{
        width: "100%",
        alignSelf: "center",
        backgroundColor: colors.primary.background,
        flex: 1
      }}
    >
      <Header
        style={{
          backgroundColor: "transparent"
        }}
        title={strings.manageTags()}
        canGoBack
      />

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          flex: 1,
          gap: Spacing.LEVEL_3
        }}
      >
        <Input
          button={{
            icon: "search",
            iconFamily: "notesnook",
            color: colors.primary.icon,
            size: 16,
            onPress: () => {}
          }}
          containerStyle={{
            backgroundColor: colors.secondary.background,
            borderWidth: 0
          }}
          testID="tag-input"
          fwdRef={inputRef}
          autoCapitalize="none"
          onChangeText={(v) => {
            clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              setQuery(sanitizeTag(v));
              checkQueryExists(sanitizeTag(v));
            }, 300);
          }}
          onSubmit={() => {
            onSubmit();
          }}
          placeholder={strings.searchForTags()}
        />

        <View
          style={{
            height: 1,
            backgroundColor: colors.primary.separator
          }}
        />

        <View
          style={{
            flex: 1
          }}
        >
          <LegendList
            data={tags || []}
            extraData={tags}
            keyboardShouldPersistTaps
            keyboardDismissMode="interactive"
            estimatedItemSize={50}
            renderItem={renderTag}
            ListHeaderComponent={
              query && !queryExists ? (
                <Pressable
                  key={"query_item"}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: Spacing.LEVEL_2,
                    borderRadius: Radius.XS,
                    marginBottom: Spacing.LEVEL_0
                  }}
                  onPress={onSubmit}
                  type="selected"
                >
                  <Heading
                    fontSize="SM"
                    fontFamily="MEDIUM"
                    color={colors.selected.heading}
                  >
                    {strings.add()} {'"' + "#" + query + '"'}
                  </Heading>
                  <AppIcon
                    name="plus"
                    iconFamily="material"
                    color={colors.selected.icon}
                    size={AppFontSize.md}
                  />
                </Pressable>
              ) : null
            }
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

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.primary.border,
          backgroundColor: colors.primary.background,
          padding: Spacing.LEVEL_3
        }}
      >
        <Button
          title={strings.saveChanges()}
          type="accent"
          width="100%"
          disabled={!hasChanges}
          onPress={onSave}
        />
      </View>
    </SafeAreaView>
  );
};

ManageTags.present = (ids?: string[]) => {
  Navigation.push("ManageTags", {
    ids: ids
  });
};

export default ManageTags;

const TagItem = ({
  onPress,
  tag
}: {
  tag: Tag;
  onPress: (id: string) => void;
}) => {
  const { colors } = useThemeColors();
  const selection = useTagItemSelection((state) =>
    tag?.id ? state.selection[tag?.id] : undefined
  );
  const selected = selection === "selected" || selection === "intermediate";

  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.LEVEL_1,
        justifyContent: "flex-start",
        padding: Spacing.LEVEL_2,
        borderRadius: Radius.XS,
        marginBottom: Spacing.LEVEL_0
      }}
      onPress={() => {
        if (!tag) return;
        onPress(tag.id);
      }}
      type={selected ? "selected" : "transparent"}
    >
      <AppIcon
        name={
          selection === "selected"
            ? "checkbox"
            : selection === "intermediate"
              ? "checkbox-intermediate"
              : "box-empty"
        }
        iconFamily="notesnook"
        size={16}
        color={
          selected
            ? [colors.selected.accent, colors.static.white]
            : colors.secondary.icon
        }
      />
      <Paragraph
        fontSize="SM"
        color={selected ? colors.primary.heading : colors.secondary.paragraph}
      >
        {"#" + tag?.title}
      </Paragraph>
    </Pressable>
  );
};
