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

import React from "react";
import { ScrollView, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import Notebook from "../../screens/notebook";
import { TopicNotes } from "../../screens/notes/topic-notes";
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useNotebookStore } from "../../stores/use-notebook-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import { eClearEditor } from "../../utils/events";

export default function Notebooks({ note, close, full }) {
  const { colors } = useThemeColors();
  const notebooks = useNotebookStore((state) => state.notebooks);
  function getNotebooks(item) {
    let filteredNotebooks = [];
    const relations = db.relations.to(note, "notebook");
    filteredNotebooks.push(
      ...relations.map((notebook) => ({
        ...notebook,
        topics: []
      }))
    );
    if (!item.notebooks || item.notebooks.length < 1) return filteredNotebooks;

    for (let notebookReference of item.notebooks) {
      let notebook = {
        ...(notebooks.find((item) => item.id === notebookReference.id) || {})
      };
      if (notebook.id) {
        notebook.topics = notebook.topics.filter((topic) => {
          return notebookReference.topics.findIndex((t) => t === topic.id) > -1;
        });
        const index = filteredNotebooks.findIndex(
          (item) => item.id === notebook.id
        );
        if (index > -1) {
          filteredNotebooks[index].topics = notebook.topics;
        } else {
          filteredNotebooks.push(notebook);
        }
      }
    }
    return filteredNotebooks;
  }
  const noteNotebooks = getNotebooks(note);

  const navigateNotebook = (id) => {
    let item = db.notebooks.notebook(id)?.data;
    if (!item) return;
    Notebook.navigate(item, true);
  };

  const navigateTopic = (id, notebookId) => {
    let item = db.notebooks.notebook(notebookId)?.topics?.topic(id)?._topic;
    if (!item) return;
    TopicNotes.navigate(item, true);
  };
  const renderItem = (item) => (
    <View
      key={item.id}
      style={{
        justifyContent: "flex-start",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        flexGrow: 1,
        padding: 6,
        borderWidth: full ? 0 : 1,
        borderColor: colors.primary.background,
        borderRadius: 10,
        backgroundColor: full ? "transparent" : colors.secondary.background,
        minHeight: 42
      }}
    >
      <Icon
        name="book-outline"
        color={colors.primary.accent}
        size={SIZE.sm}
        style={{
          marginRight: 5
        }}
      />
      <Heading
        numberOfLines={1}
        style={{
          maxWidth: "50%"
        }}
        size={SIZE.sm}
        onPress={() => {
          navigateNotebook(item.id);
          eSendEvent(eClearEditor);
          close();
        }}
      >
        {item.title}
      </Heading>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={{
          flexDirection: "row",
          marginLeft: 8,
          borderLeftColor: colors.primary.hover,
          borderLeftWidth: 1,
          paddingLeft: 8
        }}
      >
        {item.topics.map((topic) => (
          <Button
            key={topic.id}
            onPress={() => {
              navigateTopic(topic.id, item.id);
              eSendEvent(eClearEditor);
              close();
            }}
            onLongPress={async () => {
              await db.notes.removeFromNotebook(
                {
                  id: item.id,
                  topic: topic.id
                },
                note
              );
              useNotebookStore.getState().setNotebooks();
              Navigation.queueRoutesForUpdate();
              ToastEvent.show({
                heading: "Note removed from topic",
                context: "local",
                type: "success"
              });
            }}
            title={topic.title}
            type="gray"
            height={30}
            fontSize={SIZE.xs}
            icon="bookmark-outline"
            style={{
              marginRight: 5,
              borderRadius: 100,
              paddingHorizontal: 8
            }}
          />
        ))}
        <View style={{ width: 10 }} />
      </ScrollView>
    </View>
  );

  return noteNotebooks.length === 0 ? null : (
    <View
      style={{
        width: "100%",
        borderRadius: 10,
        marginTop: 6
      }}
    >
      {full
        ? noteNotebooks.map(renderItem)
        : noteNotebooks.slice(0, 1).map(renderItem)}

      {noteNotebooks.length > 1 && !full ? (
        <Button
          title={`See all linked notebooks`}
          fontSize={SIZE.xs}
          style={{
            alignSelf: "flex-end",
            marginRight: 12,
            paddingHorizontal: 0,
            backgroundColor: "transparent"
          }}
          type="gray"
          textStyle={{
            textDecorationLine: "underline"
          }}
          height={20}
          onPress={() => {
            presentSheet({
              context: "properties",
              component: (ref, close) => (
                <Notebooks note={note} close={close} full={true} />
              )
            });
          }}
        />
      ) : undefined}
    </View>
  );
}
