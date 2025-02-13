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

import React, { RefObject, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { getFormattedDate, getTimeAgo } from "@notesnook/common";
import { HistorySession, Note, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { useDBItem } from "../../hooks/use-db-item";
import { presentSheet } from "../../services/event-manager";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import DialogHeader from "../dialog/dialog-header";
import SheetProvider from "../sheet-provider";
import { Pressable } from "../ui/pressable";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";
import NotePreview from "./preview";
import { strings } from "@notesnook/intl";

const HistoryItem = ({
  index,
  items,
  note
}: {
  index: number;
  items?: VirtualizedGrouping<HistorySession>;
  note?: Note;
}) => {
  const [item] = useDBItem(index, "noteHistory", items);
  const { colors } = useThemeColors();
  const getDate = (start: number, end: number) => {
    const _start_date = getFormattedDate(start, "date");
    const _end_date = getFormattedDate(end + 60000, "date");

    const _start_time = getFormattedDate(start, "time");
    const _end_time = getFormattedDate(end + 60000, "time");

    return `${_start_date} ${_start_time} - ${
      _end_date === _start_date ? " " : _end_date + " "
    }${_end_time}`;
  };

  const preview = useCallback(async (item: HistorySession) => {
    const content = await db.noteHistory.content(item.id);
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

  return (
    <Pressable
      type="secondary"
      onPress={() => {
        if (!item) return;
        preview(item);
      }}
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        height: 45,
        marginBottom: 10,
        flexDirection: "row"
      }}
    >
      {!item ? null : (
        <>
          <Paragraph>{getDate(item.dateCreated, item.dateModified)}</Paragraph>
          <Paragraph color={colors.secondary.paragraph} size={AppFontSize.xs}>
            {getTimeAgo(item.dateModified)}
          </Paragraph>
        </>
      )}
    </Pressable>
  );
};

export default function NoteHistory({
  note
}: {
  note: Note;
  fwdRef: RefObject<ActionSheetRef>;
}) {
  const [history, setHistory] = useState<VirtualizedGrouping<HistorySession>>();
  const [_loading, setLoading] = useState(true);
  const { colors } = useThemeColors();

  useEffect(() => {
    db.noteHistory
      .get(note.id)
      .sorted({
        sortBy: "dateModified",
        sortDirection: "desc"
      })
      .then((result) => {
        setHistory(result);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
      });
  }, [note.id]);

  const renderItem = useCallback(
    ({ index }: { index: number }) => (
      <HistoryItem index={index} items={history} />
    ),
    [history]
  );

  return (
    <View>
      <SheetProvider context="note_history" />
      <DialogHeader title={strings.noteHistory()} padding={12} />

      <Seperator />

      <View
        style={{
          paddingHorizontal: 12,
          height: !history?.placeholders.length
            ? 300
            : (history.placeholders.length + 1) * 55,
          maxHeight: "100%"
        }}
      >
        <FlashList
          data={history?.placeholders}
          estimatedItemSize={55}
          ListEmptyComponent={
            <View
              style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                height: 300,
                gap: 10
              }}
            >
              {_loading ? (
                <ActivityIndicator
                  size={AppFontSize.xl}
                  color={colors.primary.accent}
                />
              ) : (
                <>
                  <Icon name="history" size={50} color={colors.primary.icon} />
                  <Paragraph color={colors.secondary.paragraph}>
                    {strings.noteHistoryPlaceholder()}
                  </Paragraph>
                </>
              )}
            </View>
          }
          renderItem={renderItem}
        />
      </View>
      <Paragraph
        size={AppFontSize.xs}
        color={colors.secondary.paragraph}
        style={{
          alignSelf: "center"
        }}
      >
        {strings.noteHistoryNotice[0]()}{" "}
        <Text
          onPress={() => {
            openLinkInBrowser(
              "https://help.notesnook.com/note-version-history"
            );
          }}
          style={{
            color: colors.primary.accent,
            textDecorationLine: "underline"
          }}
        >
          {strings.noteHistoryNotice[1]()}
        </Text>
      </Paragraph>
    </View>
  );
}
