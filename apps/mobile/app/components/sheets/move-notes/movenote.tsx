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

import { Note, Notebook, Topic } from "@notesnook/core/dist/types";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useState } from "react";
import { Platform, useWindowDimensions, View } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import { db } from "../../../common/database";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import SearchService from "../../../services/search";
import { eCloseSheet } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { presentDialog } from "../../dialog/functions";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export const MoveNotes = ({
  notebook,
  selectedTopic,
  fwdRef
}: {
  notebook: Notebook;
  selectedTopic?: Topic;
  fwdRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const [currentNotebook, setCurrentNotebook] = useState(notebook);
  const { height } = useWindowDimensions();
  let notes = db.notes?.all;

  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [topic, setTopic] = useState(selectedTopic);

  notes = notes.filter((note) => {
    if (!topic) return [];
    const noteIds = db.notes?.topicReferences.get(topic.id);
    return noteIds.indexOf(note.id) === -1;
  });

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

  const openAddTopicDialog = () => {
    presentDialog({
      context: "local",
      input: true,
      inputPlaceholder: "Enter title",
      title: "New topic",
      paragraph: "Add a new topic in " + currentNotebook.title,
      positiveText: "Add",
      positivePress: (value) => {
        return addNewTopic(value as string);
      }
    });
  };

  const addNewTopic = async (value: string) => {
    if (!value || value.trim().length === 0) {
      ToastManager.show({
        heading: "Topic title is required",
        type: "error",
        context: "local"
      });
      return false;
    }
    await db.notebooks?.topics(currentNotebook.id).add({
      title: value
    });

    const notebook = db.notebooks?.notebook(currentNotebook.id);
    if (notebook) {
      setCurrentNotebook(notebook.data);
    }

    Navigation.queueRoutesForUpdate();
    return true;
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Topic | Note }) => {
      return (
        <PressableButton
          testID="listitem.select"
          onPress={() => {
            if (item.type == "topic") {
              setTopic(topic || item);
            } else {
              select(item.id);
            }
          }}
          type={"transparent"}
          customStyle={{
            paddingVertical: 12,
            justifyContent: "space-between",
            paddingHorizontal: 12,
            flexDirection: "row"
          }}
        >
          <View
            style={{
              flexShrink: 1
            }}
          >
            <Paragraph
              numberOfLines={1}
              color={
                item?.id === topic?.id
                  ? colors.primary.accent
                  : colors.primary.paragraph
              }
            >
              {item.title}
            </Paragraph>
            {item.type == "note" && item.headline ? (
              <Paragraph
                numberOfLines={1}
                color={colors.secondary.paragraph}
                size={SIZE.xs}
              >
                {item.headline}
              </Paragraph>
            ) : null}
          </View>

          {item.type === "topic" ? (
            <Paragraph
              style={{
                fontSize: SIZE.xs
              }}
              color={colors.secondary.paragraph}
            >
              {item.notes?.length} Notes
            </Paragraph>
          ) : null}

          {selectedNoteIds.indexOf(item.id) > -1 ? (
            <IconButton
              customStyle={{
                width: undefined,
                height: undefined,
                backgroundColor: "transparent"
              }}
              name="check"
              type="selected"
              color={colors.selected.icon}
            />
          ) : null}
        </PressableButton>
      );
    },
    [
      colors.primary.accent,
      colors.secondary.paragraph,
      colors.primary.paragraph,
      colors.selected.icon,
      select,
      selectedNoteIds,
      topic
    ]
  );

  /**
   *
   */
  return (
    <View
      style={{
        paddingHorizontal: 12,
        maxHeight: Platform.OS === "ios" ? "96%" : "97%",
        height: height * 0.9
      }}
    >
      <Dialog context="local" />
      {topic ? (
        <PressableButton
          onPress={() => {
            setTopic(undefined);
          }}
          customStyle={{
            paddingVertical: 12,
            justifyContent: "space-between",
            paddingHorizontal: 12,
            marginBottom: 10,
            alignItems: "flex-start"
          }}
          type="grayBg"
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%"
            }}
          >
            <Heading size={SIZE.md}>
              Adding notes to {currentNotebook.title}
            </Heading>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              marginTop: 5
            }}
          >
            <Paragraph color={colors.selected.paragraph}>
              in {topic.title}
            </Paragraph>

            <Paragraph
              style={{
                fontSize: SIZE.xs
              }}
            >
              Tap to change
            </Paragraph>
          </View>
        </PressableButton>
      ) : (
        <>
          <DialogHeader
            title={`Add notes to ${currentNotebook.title}`}
            paragraph={
              "Select the topic in which you would like to move notes."
            }
          />
          <Seperator />
        </>
      )}

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
              {topic ? "No notes to show" : "No topics in this notebook"}
            </Paragraph>

            {!topic && (
              <Button
                style={{
                  marginTop: 10,
                  height: 40
                }}
                onPress={() => {
                  openAddTopicDialog();
                }}
                title="Add first topic"
                type="grayAccent"
              />
            )}
          </View>
        }
        data={topic ? notes : currentNotebook.topics}
        renderItem={renderItem}
      />
      {selectedNoteIds.length > 0 ? (
        <Button
          onPress={async () => {
            if (!topic) return;
            await db.notes?.addToNotebook(
              {
                topic: topic.id,
                id: topic.notebookId
              },
              ...selectedNoteIds
            );
            Navigation.queueRoutesForUpdate();
            SearchService.updateAndSearch();
            eSendEvent(eCloseSheet);
          }}
          title="Move selected notes"
          type="accent"
          width="100%"
        />
      ) : null}
    </View>
  );
};

MoveNotes.present = (notebook: Notebook, topic: Topic) => {
  presentSheet({
    component: (ref: RefObject<ActionSheetRef>) => (
      <MoveNotes fwdRef={ref} notebook={notebook} selectedTopic={topic} />
    )
  });
};
