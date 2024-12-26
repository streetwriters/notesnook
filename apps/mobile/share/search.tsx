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

import {
  Item,
  Note,
  Notebook,
  Tag,
  VirtualizedGrouping
} from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import create from "zustand";
import { db } from "../app/common/database";
import Paragraph from "../app/components/ui/typography/paragraph";
import { useDBItem, useNoteLocked } from "../app/hooks/use-db-item";
import { useNotebook } from "../app/hooks/use-notebook";
import { getElevationStyle } from "../app/utils/elevation";
import { initDatabase, useShareStore } from "./store";

export const useNotebookExpandedStore = create<{
  expanded: {
    [id: string]: boolean;
  };
  setExpanded: (id: string) => void;
}>((set, get) => ({
  expanded: {},
  setExpanded(id: string) {
    set({
      expanded: {
        ...get().expanded,
        [id]: !get().expanded[id]
      }
    });
  }
}));
const SearchSetters = {
  appendNote: (id: string) => {
    useShareStore.getState().setAppendNote(id);
    close();
  },
  selectNotebooks: (id: string) => {
    const selectedNotebooks = [...useShareStore.getState().selectedNotebooks];
    const currentIndex = selectedNotebooks.findIndex(
      (selected) => id === selected
    );
    if (currentIndex === -1) {
      selectedNotebooks.push(id as never);
    } else {
      selectedNotebooks.splice(currentIndex, 1);
    }
    useShareStore.getState().setSelectedNotebooks(selectedNotebooks);
  },
  selectTags: (id: string) => {
    const selectedTags = [...useShareStore.getState().selectedTags];
    const currentIndex = selectedTags.indexOf(id as never);
    if (currentIndex === -1) {
      selectedTags.push(id as never);
    } else {
      selectedTags.splice(currentIndex, 1);
    }
    useShareStore.getState().setSelectedTags(selectedTags);
  }
};

const SearchGetters = {
  appendNote: () => db.notes.all.sorted(db.settings.getGroupOptions("notes")),
  selectNotebooks: () =>
    db.notebooks.roots.sorted(db.settings.getGroupOptions("notebooks")),
  selectTags: () => {
    return db.tags.all.sorted(db.settings.getGroupOptions("tags"));
  }
};

const SearchLookup = {
  appendNote: (query: string) => {
    return db.lookup.notes(query).sorted();
  },
  selectNotebooks: (query: string) => {
    return db.lookup.notebooks(query).sorted();
  },
  selectTags: (query: string) => {
    return db.lookup.tags(query).sorted();
  }
};

const SearchPlaceholder = {
  appendNote: "Search for a note",
  selectNotebooks: "Search for a notebook",
  selectTags: "Search for a tag"
};

type SearchMode = "appendNote" | "selectNotebooks" | "selectTags";

const NotebookItem = ({
  id,
  mode,
  close,
  items,
  level = 0
}: {
  id: string | number;
  mode: SearchMode;
  close?: () => void;
  level?: number;
  items?: VirtualizedGrouping<Notebook>;
}) => {
  const { nestedNotebooks, notebook } = useNotebook(id, items);
  const isExpanded = useNotebookExpandedStore((state) =>
    !notebook ? false : state.expanded[notebook.id]
  );
  const { colors } = useThemeColors();
  const isSelected = useShareStore((state) =>
    !notebook
      ? false
      : state.selectedNotebooks.findIndex(
          (selectedId) => notebook?.id === selectedId
        ) > -1
  );
  const set = SearchSetters[mode];

  const onSelectItem = async () => {
    if (!notebook) return;
    set(notebook.id);
  };

  return !notebook ? (
    <View
      style={{
        height: 40
      }}
    />
  ) : (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelectItem()}
      style={{
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          height: 40,
          alignItems: "center"
        }}
      >
        {nestedNotebooks?.placeholders.length ? (
          <TouchableOpacity
            style={{
              width: 35,
              height: 35,
              justifyContent: "center",
              alignItems: "center"
            }}
            onPress={() => {
              if (!notebook) return;
              useNotebookExpandedStore.getState().setExpanded(notebook.id);
            }}
            activeOpacity={1}
          >
            <Icon
              size={20}
              color={colors.primary.icon}
              name={isExpanded ? "chevron-down" : "chevron-right"}
            />
          </TouchableOpacity>
        ) : (
          <View
            style={{
              width: 35,
              height: 30,
              justifyContent: "center",
              alignItems: "center"
            }}
          />
        )}

        <Icon
          name={
            !isSelected
              ? "checkbox-blank-circle-outline"
              : "check-circle-outline"
          }
          style={{
            marginRight: 10
          }}
          size={20}
          color={isSelected ? colors.primary.accent : colors.secondary.icon}
        />

        <View
          style={{
            flexDirection: "column"
          }}
        >
          <Paragraph
            numberOfLines={1}
            style={{
              color: colors.primary.paragraph,
              fontSize: 15
            }}
          >
            {notebook.title}
          </Paragraph>
        </View>
      </View>

      {nestedNotebooks?.placeholders?.length && isExpanded ? (
        <View
          style={{
            paddingLeft: level + 1 > 0 && level + 1 < 5 ? 15 : 0,
            marginTop: 5
          }}
        >
          {nestedNotebooks.placeholders.map((item, index) => (
            <NotebookItem
              key={notebook?.id + index}
              id={index}
              mode={mode}
              close={close}
              level={level + 1}
            />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const ListItem = ({
  id,
  mode,
  close,
  items
}: {
  id: string | number;
  mode: SearchMode;
  close?: () => void;
  items?: VirtualizedGrouping<Item>;
}) => {
  const [item] = useDBItem(
    id,
    mode === "appendNote" ? "note" : "tag",
    items as VirtualizedGrouping<Note | Tag>
  );
  const locked = useNoteLocked(mode === "appendNote" ? item?.id : undefined);
  const { colors } = useThemeColors();
  const isSelected = useShareStore((state) =>
    mode === "appendNote" || !item
      ? false
      : state.selectedTags.indexOf(item?.id as never) > -1
  );

  const set = SearchSetters[mode];

  const onSelectItem = async () => {
    if (!item) {
      return;
    }

    if (mode === "appendNote") close?.();
    set(item.id);
  };

  return locked ? null : (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelectItem()}
      style={{
        flexDirection: "column",
        borderBottomWidth: 1,
        borderBottomColor: colors.primary.border,
        justifyContent: "center",
        paddingVertical: 12,
        minHeight: 45
      }}
    >
      {!item ? null : (
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 12
          }}
        >
          {item.type !== "note" ? (
            <Icon
              name={
                !isSelected
                  ? "checkbox-blank-circle-outline"
                  : "check-circle-outline"
              }
              style={{
                marginRight: 10
              }}
              size={20}
              color={isSelected ? colors.primary.accent : colors.secondary.icon}
            />
          ) : null}

          <View
            style={{
              flexDirection: "column"
            }}
          >
            <Paragraph
              numberOfLines={1}
              style={{
                color: colors.primary.paragraph,
                fontSize: 15
              }}
            >
              {item.type === "tag" ? "#" : ""}
              {item.title}
            </Paragraph>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const Search = ({
  close,
  getKeyboardHeight,
  mode
}: {
  close?: () => void;
  getKeyboardHeight: () => number;
  mode: SearchMode;
}) => {
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const timer = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);
  const [items, setItems] = useState<VirtualizedGrouping<Item>>();
  const [searchKeyword, setSearchKeyword] = useState<string>();
  const [queryExists, setQueryExists] = useState(false);

  const checkQueryExists = (query: string) => {
    if (!query) {
      setQueryExists(false);
    }
    db.tags.all
      .find((v) => v.and([v(`title`, "==", query)]))
      .then((exists) => setQueryExists(!!exists));
  };

  const get = SearchGetters[mode];
  const lookup = SearchLookup[mode];

  const onSearch = async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = undefined;
    }
    timer.current = setTimeout(async () => {
      if (!searchKeyword) {
        setItems(undefined);
        setItems(await get());
        setQueryExists(false);
        return;
      }
      setItems(await lookup(searchKeyword));
    }, 150);
  };

  useEffect(() => {
    (async () => {
      await initDatabase();
      setItems(await get());
    })();
  }, [get]);

  const renderItem = React.useCallback(
    ({ index }: { item: boolean; index: number }) =>
      mode === "selectNotebooks" ? (
        <NotebookItem
          id={index}
          mode={mode}
          close={close}
          items={items as VirtualizedGrouping<Notebook>}
        />
      ) : (
        <ListItem id={index} mode={mode} close={close} items={items} />
      ),
    [close, mode, items]
  );

  const searchHeight = height - getKeyboardHeight();
  return (
    <View
      style={{
        position: "absolute",
        top: Platform.OS === "android" ? 20 : 0,
        backgroundColor: colors.primary.background,
        borderRadius: 10,
        width: "95%",
        minHeight: 250,
        alignSelf: "center",
        overflow: "hidden",
        zIndex: 999,
        ...getElevationStyle(5)
      }}
    >
      <View
        style={{
          flexShrink: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 6,
          marginBottom: 10,
          height: 50
        }}
      >
        <Icon
          name="arrow-left"
          color={colors.secondary.icon}
          style={{
            marginRight: 10
          }}
          size={25}
          onPress={close}
        />
        <TextInput
          ref={inputRef}
          placeholder={SearchPlaceholder[mode]}
          placeholderTextColor={colors.primary.placeholder}
          style={{
            fontSize: 16,
            flex: 1
          }}
          onChangeText={(value) => {
            setSearchKeyword(value);
            onSearch();
            checkQueryExists(value);
          }}
          onSubmitEditing={onSearch}
        />

        <Icon
          name="magnify"
          color={colors.primary.icon}
          size={25}
          onPress={onSearch}
        />
      </View>

      <View
        style={{
          maxHeight: searchHeight > 550 ? 550 : searchHeight,
          height: searchHeight > 550 ? 550 : searchHeight
        }}
      >
        {mode === "selectTags" && !queryExists && searchKeyword ? (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              paddingHorizontal: 12,
              height: 40,
              alignItems: "center"
            }}
            activeOpacity={1}
            onPress={async () => {
              if (!searchKeyword) return;
              const tagId = await db.tags.add({
                title: searchKeyword
              });
              if (!tagId) return;
              SearchSetters.selectTags(tagId);
              onSearch();
              checkQueryExists(searchKeyword);
            }}
          >
            <Paragraph
              numberOfLines={1}
              style={{
                color: colors.primary.paragraph,
                fontSize: 15
              }}
            >
              Add #{searchKeyword}
            </Paragraph>
          </TouchableOpacity>
        ) : null}

        <FlatList
          data={items?.placeholders}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          renderItem={renderItem}
          windowSize={1}
          ListFooterComponent={<View style={{ height: 200 }} />}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                height: 200
              }}
            >
              <Text
                style={{
                  color: colors.secondary.icon
                }}
              >
                {searchKeyword
                  ? `No results found for "${searchKeyword}"`
                  : mode === "appendNote"
                  ? "No notes"
                  : mode === "selectTags"
                  ? "No tags"
                  : "No notebooks"}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};
