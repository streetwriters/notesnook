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

import React, { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { presentSheet } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { openLinkInBrowser } from "../../utils/functions";
import { SIZE } from "../../utils/size";
import { getFormattedDate, timeSince } from "../../utils/time";
import DialogHeader from "../dialog/dialog-header";
import SheetProvider from "../sheet-provider";
import { PressableButton } from "../ui/pressable";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";
import NotePreview from "./preview";

export default function NoteHistory({ note, fwdRef }) {
  const [history, setHistory] = useState([]);
  const [_loading, setLoading] = useState(true);
  const colors = useThemeStore((state) => state.colors);

  useEffect(() => {
    (async () => {
      setHistory([...(await db.noteHistory.get(note.id))]);
      setLoading(false);
    })();
  }, [note.id]);

  const preview = useCallback(async (item) => {
    let content = await db.noteHistory.content(item.id);
    presentSheet({
      component: (
        <NotePreview
          session={{
            ...item,
            session: getDate(item.dateCreated, item.dateModified)
          }}
          content={content}
        />
      ),
      context: "note_history"
    });
  }, []);

  const getDate = (start, end) => {
    let _start_date = getFormattedDate(start, "date");
    let _end_date = getFormattedDate(end + 60000, "date");

    let _start_time = getFormattedDate(start, "time");
    let _end_time = getFormattedDate(end + 60000, "time");

    return `${_start_date} ${_start_time} - ${
      _end_date === _start_date ? " " : _end_date + " "
    }${_end_time}`;
  };

  const renderItem = useCallback(
    ({ item }) => (
      <PressableButton
        type="grayBg"
        onPress={() => preview(item)}
        customStyle={{
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 12,
          height: 45,
          marginBottom: 10,
          flexDirection: "row"
        }}
      >
        <Paragraph>{getDate(item.dateCreated, item.dateModified)}</Paragraph>
        <Paragraph color={colors.icon} size={SIZE.xs}>
          {timeSince(item.dateModified)}
        </Paragraph>
      </PressableButton>
    ),
    [colors.icon, preview]
  );

  return (
    <View>
      <SheetProvider context="note_history" />
      <DialogHeader
        title="Note history"
        paragraph="Revert back to an older version of this note"
        padding={12}
      />

      <Seperator />

      <FlatList
        onMomentumScrollEnd={() => {
          fwdRef?.current?.handleChildScrollEnd();
        }}
        style={{
          paddingHorizontal: 12
        }}
        nestedScrollEnabled
        keyExtractor={(item) => item.id}
        data={history}
        ListFooterComponent={<View style={{ height: 250 }} />}
        ListEmptyComponent={
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: 200
            }}
          >
            <Icon name="history" size={60} color={colors.icon} />
            <Paragraph color={colors.icon}>
              No note history found on this device.
            </Paragraph>
          </View>
        }
        renderItem={renderItem}
      />
      <Paragraph
        size={SIZE.xs}
        color={colors.icon}
        style={{
          alignSelf: "center"
        }}
      >
        Note version history is local only.{" "}
        <Text
          onPress={() => {
            openLinkInBrowser(
              "https://docs.notesnook.com/versionhistory",
              colors
            );
          }}
          style={{ color: colors.accent, textDecorationLine: "underline" }}
        >
          Learn how this works.
        </Text>
      </Paragraph>
    </View>
  );
}
