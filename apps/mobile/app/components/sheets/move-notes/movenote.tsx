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
import { Note, Notebook } from "@notesnook/core/dist/types";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useEffect, useState } from "react";
import { View } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { db } from "../../../common/database";
import { useDBItem } from "../../../hooks/use-db-item";
import { presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { createItemSelectionStore } from "../../../stores/item-selection-store";
import { updateNotebook } from "../../../utils/notebooks";
import { SIZE } from "../../../utils/size";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Paragraph from "../../ui/typography/paragraph";

const useItemSelectionStore = createItemSelectionStore(true);

export const MoveNotes = ({
  notebook,
  fwdRef
}: {
  notebook: Notebook;
  fwdRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const currentNotebook = notebook;
  const selectionCount = useItemSelectionStore(
    (state) =>
      Object.keys(state.selection).filter(
        (k) =>
          state.initialState?.[k] !== "selected" &&
          state.selection[k] !== "deselected"
      )?.length > 0
  );

  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();

  useEffect(() => {
    db.notes?.all.sorted(db.settings.getGroupOptions("notes")).then((notes) => {
      setNotes(notes);
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

    return () => {
      useItemSelectionStore.getState().reset();
    };
  }, [currentNotebook]);

  const renderItem = React.useCallback(
    ({ index }: { item: boolean; index: number }) => {
      return <SelectableNoteItem id={index} items={notes} />;
    },
    [notes]
  );

  return (
    <View
      style={{
        paddingHorizontal: 12,
        maxHeight: "100%",
        height: notes?.placeholders.length
          ? 50 * (notes?.placeholders.length + 2)
          : 300
      }}
    >
      <Dialog context="local" />

      <DialogHeader
        title={`Add notes to ${currentNotebook.title}`}
        paragraph={"Select the topic in which you would like to move notes."}
      />
      <Seperator />

      <FlashList
        ListEmptyComponent={
          <View
            style={{
              minHeight: 100,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Paragraph color={colors.secondary.paragraph}>
              No notes to show
            </Paragraph>
          </View>
        }
        estimatedItemSize={50}
        data={notes?.placeholders}
        renderItem={renderItem}
      />

      {selectionCount ? (
        <Button
          onPress={async () => {
            await db.notes?.addToNotebook(
              currentNotebook.id,
              ...useItemSelectionStore.getState().getSelectedItemIds()
            );
            updateNotebook(currentNotebook.id);
            Navigation.queueRoutesForUpdate();
            fwdRef?.current?.hide();
          }}
          title="Move selected notes"
          type="accent"
          width="100%"
        />
      ) : null}
    </View>
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

    return exists ? null : (
      <PressableButton
        testID="listitem.select"
        onPress={() => {
          if (!item) return;
          useItemSelectionStore
            .getState()
            .markAs(item, selected ? "deselected" : "selected");
        }}
        type={"transparent"}
        customStyle={{
          paddingVertical: 12,
          flexDirection: "row",
          width: "100%",
          justifyContent: "flex-start",
          height: 50
        }}
      >
        {!item ? null : (
          <>
            <IconButton
              customStyle={{
                backgroundColor: "transparent",
                marginRight: 5
              }}
              onPress={() => {
                if (!item) return;
                useItemSelectionStore
                  .getState()
                  .markAs(item, selected ? "deselected" : "selected");
              }}
              top={0}
              left={0}
              right={0}
              bottom={0}
              name={
                selected
                  ? "check-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
              type="selected"
              color={selected ? colors.selected.icon : colors.primary.icon}
            />

            <View
              style={{
                flexShrink: 1
              }}
            >
              <Paragraph numberOfLines={1}>{item?.title}</Paragraph>
              {item.type == "note" && item.headline ? (
                <Paragraph
                  numberOfLines={1}
                  color={colors?.secondary.paragraph}
                  size={SIZE.xs}
                >
                  {item.headline}
                </Paragraph>
              ) : null}
            </View>
          </>
        )}
      </PressableButton>
    );
  }
);

SelectableNoteItem.displayName = "SelectableNoteItem";

MoveNotes.present = (notebook?: Notebook) => {
  if (!notebook) return;
  presentSheet({
    component: (ref: RefObject<ActionSheetRef>) => (
      <MoveNotes fwdRef={ref} notebook={notebook} />
    )
  });
};
