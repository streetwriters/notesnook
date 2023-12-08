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
import { Platform, View, useWindowDimensions } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { db } from "../../../common/database";
import { presentSheet } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { updateNotebook } from "../../../utils/notebooks";
import { SIZE } from "../../../utils/size";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Paragraph from "../../ui/typography/paragraph";
import { useDBItem } from "../../../hooks/use-db-item";

export const MoveNotes = ({
  notebook,
  fwdRef
}: {
  notebook: Notebook;
  fwdRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const currentNotebook = notebook;

  const { height } = useWindowDimensions();
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<VirtualizedGrouping<Note>>();
  const [existingNoteIds, setExistingNoteIds] = useState<string[]>([]);

  useEffect(() => {
    db.notes?.all.sorted(db.settings.getGroupOptions("notes")).then((notes) => {
      setNotes(notes);
    });
    db.relations
      .from(currentNotebook, "note")
      .get()
      .then((existingNotes) => {
        setExistingNoteIds(
          existingNotes.map((existingNote) => existingNote.toId)
        );
      });
  }, [currentNotebook]);

  const select = React.useCallback(
    (id: string) => {
      const index = selectedNoteIds.indexOf(id);
      if (index > -1) {
        setSelectedNoteIds((selectedNoteIds) => {
          const next = [...selectedNoteIds];
          next.splice(index, 1);
          return next;
        });
      } else {
        setSelectedNoteIds((selectedNoteIds) => {
          const next = [...selectedNoteIds];
          next.push(id);
          return next;
        });
      }
    },
    [selectedNoteIds]
  );

  const renderItem = React.useCallback(
    ({ index }: { item: string | number; index: number }) => {
      return (
        <SelectableNoteItem
          id={index}
          items={notes}
          select={select}
          selected={(id) => selectedNoteIds?.indexOf(id) > -1}
          exists={(id) => existingNoteIds.indexOf(id) > -1}
        />
      );
    },
    [existingNoteIds, notes, select, selectedNoteIds]
  );

  return (
    <View
      style={{
        paddingHorizontal: 12,
        maxHeight: Platform.OS === "ios" ? "96%" : "97%",
        height: height * 0.9
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
        data={notes?.ids}
        renderItem={renderItem}
      />
      {selectedNoteIds.length > 0 ? (
        <Button
          onPress={async () => {
            await db.notes?.addToNotebook(
              currentNotebook.id,
              ...selectedNoteIds
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

const SelectableNoteItem = ({
  id,
  items,
  select,
  selected,
  exists
}: {
  id: string | number;
  items?: VirtualizedGrouping<Note>;
  select: (id: string) => void;
  selected?: (id: string) => boolean;
  exists: (id: string) => boolean;
}) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(id, "note", items);

  return !item || exists(item.id) ? null : (
    <PressableButton
      testID="listitem.select"
      onPress={() => {
        if (!item) return;
        select(item?.id);
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
      <IconButton
        customStyle={{
          backgroundColor: "transparent",
          marginRight: 5
        }}
        onPress={() => {
          if (!item) return;
          select(item?.id);
        }}
        name={
          selected?.(item?.id)
            ? "check-circle-outline"
            : "checkbox-blank-circle-outline"
        }
        type="selected"
        color={
          selected?.(item?.id) ? colors.selected.icon : colors.primary.icon
        }
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
    </PressableButton>
  );
};

MoveNotes.present = (notebook?: Notebook) => {
  if (!notebook) return;
  presentSheet({
    component: (ref: RefObject<ActionSheetRef>) => (
      <MoveNotes fwdRef={ref} notebook={notebook} />
    )
  });
};
