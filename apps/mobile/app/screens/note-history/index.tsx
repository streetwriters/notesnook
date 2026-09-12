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
import { getFormattedDate, getTimeAgo } from "@notesnook/common";
import { HistorySession, Note, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Radius, Spacing } from "../../common/design/spacing";
import { db } from "../../common/database";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Pressable } from "../../components/ui/pressable";
import Paragraph from "../../components/ui/typography/paragraph";
import { useDBItem } from "../../hooks/use-db-item";
import Navigation, { NavigationProps } from "../../services/navigation";
import { openLinkInBrowser } from "../../utils/functions";

const getDate = (start: number, end: number) => {
  const _start_date = getFormattedDate(start, "date");
  const _end_date = getFormattedDate(end + 60000, "date");

  const _start_time = getFormattedDate(start, "time");
  const _end_time = getFormattedDate(end + 60000, "time");

  return `${_start_date} ${_start_time} - ${
    _end_date === _start_date ? " " : _end_date + " "
  }${_end_time}`;
};

const HistoryItem = ({
  index,
  items,
  note
}: {
  index: number;
  items?: VirtualizedGrouping<HistorySession>;
  note: Note;
}) => {
  const [item] = useDBItem(index, "noteHistory", items);
  const { colors } = useThemeColors();
  const selected = index === 0;

  const preview = useCallback(
    (item: HistorySession) => {
      Navigation.navigate("NotePreview", {
        note,
        session: {
          ...item,
          session: getDate(item.dateCreated, item.dateModified)
        }
      });
    },
    [note]
  );

  return (
    <Pressable
      type={"transparent"}
      onPress={() => {
        if (!item) return;
        preview(item);
      }}
      customSelectedColor={colors.primary.shade}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.LEVEL_1,
        padding: Spacing.LEVEL_2,
        borderRadius: Radius.XS,
        borderWidth: 1,
        borderColor: colors.secondary.border,
        marginBottom: Spacing.LEVEL_2
      }}
    >
      {!item ? null : (
        <>
          <AppIcon
            name="clock"
            iconFamily="notesnook"
            size={20}
            color={colors.primary.icon}
          />
          <Paragraph
            style={{ flex: 1 }}
            fontSize="XS"
            color={selected ? colors.primary.heading : colors.primary.paragraph}
          >
            {getDate(item.dateCreated, item.dateModified)}
          </Paragraph>
          <Paragraph fontSize="XXS" color={colors.secondary.paragraph}>
            {getTimeAgo(item.dateModified)}
          </Paragraph>
          <AppIcon
            name="chevron-right"
            iconFamily="notesnook"
            size={16}
            color={colors.secondary.icon}
          />
        </>
      )}
    </Pressable>
  );
};

const NoteHistory = (props: NavigationProps<"NoteHistory">) => {
  const note = props.route.params.note;
  const { colors } = useThemeColors();
  const [history, setHistory] = useState<VirtualizedGrouping<HistorySession>>();
  const [loading, setLoading] = useState(true);

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
      .catch(() => {
        setLoading(false);
      });
  }, [note.id]);

  const renderItem = useCallback(
    ({ index }: { index: number }) => (
      <HistoryItem index={index} items={history} note={note} />
    ),
    [history, note]
  );

  const hasHistory = !!history?.placeholders.length;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary.background }}
    >
      <Header
        renderedInRoute="NoteHistory"
        id="NoteHistory"
        title={strings.noteHistory()}
        style={{ backgroundColor: colors.primary.background }}
        canGoBack
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_3
        }}
      >
        {hasHistory ? (
          <Paragraph
            fontFamily="MEDIUM"
            fontSize="SM"
            color={colors.secondary.paragraph}
          >
            {strings.recentHistory()}
          </Paragraph>
        ) : null}

        <View style={{ flex: 1 }}>
          <LegendList
            data={history?.placeholders || []}
            estimatedItemSize={50}
            extraData={history}
            ListEmptyComponent={
              <View
                style={{
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  paddingTop: Spacing.LEVEL_8,
                  gap: Spacing.LEVEL_2
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primary.accent} />
                ) : (
                  <>
                    <AppIcon
                      name="clock"
                      iconFamily="notesnook"
                      size={50}
                      color={colors.primary.icon}
                    />
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
          fontSize="XS"
          color={colors.secondary.paragraph}
          style={{ alignSelf: "center", paddingBottom: Spacing.LEVEL_2 }}
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
    </SafeAreaView>
  );
};

export default NoteHistory;
