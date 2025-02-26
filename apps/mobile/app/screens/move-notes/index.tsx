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

import { Note, Notebook, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../common/database";
import { FloatingButton } from "../../components/container/floating-button";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import Input from "../../components/ui/input";
import { Notice } from "../../components/ui/notice";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { useDBItem } from "../../hooks/use-db-item";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import Navigation, { NavigationProps } from "../../services/navigation";
import { createItemSelectionStore } from "../../stores/item-selection-store";
import { updateNotebook } from "../../utils/notebooks";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
const useItemSelectionStore = createItemSelectionStore(true);

export const MoveNotes = (props: NavigationProps<"MoveNotes">) => {
  const { colors } = useThemeColors();
  const currentNotebook = props.route.params.notebook;
  const inputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const selectionCount = useItemSelectionStore(
    (state) =>
      Object.keys(state.selection).filter(
        (k) =>
          state.selection?.[k] === "selected" ||
          state.selection[k] === "deselected"
      )?.length > 0
  );

  useNavigationFocus(props.navigation, { focusOnInit: true });

  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();

  const loadNotes = React.useCallback(
    async (query?: string) => {
      setLoading(true);
      const notes = query
        ? db.lookup.notes(query).sorted()
        : db.notes?.all.sorted(db.settings.getGroupOptions("notes") as any);

      notes
        .then(async (notes) => {
          await notes.item(0);
          setNotes(notes);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });

      db.relations
        .from(currentNotebook, "note")
        .get()
        .then((existingNotes) => {
          const selection: { [name: string]: any } = {};
          existingNotes.forEach((rel) => {
            selection[rel.toId] = "selected";
          });
          useItemSelectionStore.setState({
            selection: selection,
            initialState: selection
          });
        });
    },
    [currentNotebook]
  );

  useEffect(() => {
    loadNotes();

    return () => {
      useItemSelectionStore.getState().reset();
    };
  }, [currentNotebook, loadNotes]);

  const renderItem = React.useCallback(
    ({ index }: { item: boolean; index: number }) => {
      return <SelectableNoteItem id={index} items={notes} />;
    },
    [notes]
  );

  return (
    <SafeAreaView
      style={{
        gap: DefaultAppStyles.GAP_VERTICAL,
        flex: 1,
        backgroundColor: colors.primary.background
      }}
    >
      <Header title={strings.linkNotes()} canGoBack />

      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          flex: 1,
          gap: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <Input
          button={{
            icon: "magnify",
            color: colors.primary.icon,
            size: AppFontSize.lg,
            onPress: () => {}
          }}
          testID="search-input"
          fwdRef={inputRef}
          wrapperStyle={{
            marginBottom: 0
          }}
          autoCapitalize="none"
          onChangeText={(v) => {
            loadNotes(v && v.trim() === "" ? undefined : v.trim());
          }}
          placeholder={strings.searchANote()}
        />
        <Notice
          text={strings.linkingNotesTo(currentNotebook.title)}
          size="small"
          type="information"
          style={{
            paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
          }}
        />

        <FlashList
          ListEmptyComponent={
            <View
              style={{
                minHeight: 100,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary.accent} />
              ) : (
                <Paragraph color={colors.secondary.paragraph}>
                  {strings.emptyPlaceholders("note")}
                </Paragraph>
              )}
            </View>
          }
          estimatedItemSize={50}
          data={loading ? [] : notes?.placeholders}
          renderItem={renderItem}
        />

        {selectionCount ? (
          <FloatingButton
            icon="check"
            onPress={async () => {
              await db.notes?.addToNotebook(
                currentNotebook.id,
                ...useItemSelectionStore.getState().getSelectedItemIds()
              );

              await db.notes?.removeFromNotebook(
                currentNotebook.id,
                ...useItemSelectionStore.getState().getDeselectedItemIds()
              );

              updateNotebook(currentNotebook.id);
              Navigation.queueRoutesForUpdate();
              Navigation.goBack();
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const SelectableNoteItem = React.memo(
  ({
    id,
    items
  }: {
    id: string | number;
    items?: VirtualizedGrouping<Note>;
  }) => {
    const { colors } = useThemeColors();
    const [item] = useDBItem(id, "note", items);
    const selected = useItemSelectionStore((state) =>
      item?.id ? state.selection[item.id] === "selected" : false
    );

    const exists = useItemSelectionStore((state) =>
      item?.id ? state.initialState[item.id] === "selected" : false
    );

    return (
      <Pressable
        testID="listitem.select"
        onPress={() => {
          if (!item) return;
          useItemSelectionStore
            .getState()
            .markAs(item, selected ? "deselected" : "selected");
        }}
        type={"transparent"}
        style={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "flex-start",
          height: 50,
          paddingHorizontal: DefaultAppStyles.GAP_SMALL
        }}
      >
        {!item ? null : (
          <>
            <View
              style={{
                flexGrow: 1
              }}
            >
              <Heading size={AppFontSize.sm} numberOfLines={1}>
                {item?.title}
              </Heading>
              {item.type == "note" && item.headline ? (
                <Paragraph
                  numberOfLines={1}
                  color={colors?.secondary.paragraph}
                  size={AppFontSize.sm}
                >
                  {item.headline}
                </Paragraph>
              ) : null}
            </View>

            <AppIcon
              style={{
                backgroundColor: "transparent"
              }}
              size={AppFontSize.lg}
              name={selected ? "checkbox-outline" : "checkbox-blank-outline"}
              color={
                selected
                  ? colors.selected.icon
                  : exists && !selected
                  ? colors.static.red
                  : colors.primary.icon
              }
            />
          </>
        )}
      </Pressable>
    );
  }
);

SelectableNoteItem.displayName = "SelectableNoteItem";

MoveNotes.present = (notebook?: Notebook) => {};

export default MoveNotes;
