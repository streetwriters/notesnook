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
  Attachment,
  Note,
  SortOptions,
  VirtualizedGrouping
} from "@notesnook/core";
import { FilteredSelector } from "@notesnook/core/dist/database/sql-collection";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import { presentSheet } from "../../services/event-manager";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AttachmentItem } from "./attachment-item";
import DownloadAttachments from "./download-attachments";

const DEFAULT_SORTING: SortOptions = {
  sortBy: "dateEdited",
  sortDirection: "desc"
};

export const AttachmentDialog = ({ note }: { note?: Note }) => {
  const { colors } = useThemeColors();
  const { height } = useSettingStore((state) => state.dimensions);
  const [attachments, setAttachments] =
    useState<VirtualizedGrouping<Attachment>>();
  const attachmentSearchValue = useRef<string>();
  const searchTimer = useRef<NodeJS.Timeout>();
  const [loading, setLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("all");

  const refresh = React.useCallback(() => {
    if (note) {
      db.attachments.ofNote(note.id, "all").sorted({
        ...DEFAULT_SORTING,
        sortBy: "dateModified"
      });
    } else {
      db.attachments.all
        .sorted({
          ...DEFAULT_SORTING,
          sortBy: "dateModified"
        })
        .then((attachments) => setAttachments(attachments));
    }
  }, [note]);

  useEffect(() => {
    refresh();
  }, [note, refresh]);

  const onChangeText = async (text: string) => {
    attachmentSearchValue.current = text;
    if (
      !attachmentSearchValue.current ||
      attachmentSearchValue.current === ""
    ) {
      setAttachments(await filterAttachments(currentFilter));
      refresh();
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      const results = await db.lookup
        .attachments(attachmentSearchValue.current as string)
        .sorted();
      if (results.length === 0) return;
      setAttachments(results);
    }, 300);
  };

  const renderItem = ({ index }: { item: boolean; index: number }) => (
    <AttachmentItem
      setAttachments={async () => {
        setAttachments(await filterAttachments(currentFilter));
      }}
      attachments={attachments}
      id={index}
      context="attachments-list"
    />
  );

  const onCheck = async () => {
    if (!attachments) return;
    setLoading(true);

    for (let i = 0; i < attachments.placeholders.length; i++) {
      const attachment = (await attachments.item(i))?.item;
      if (!attachment) continue;
      const result = await filesystem.checkAttachment(attachment.hash);
      if (result.failed) {
        await db.attachments.markAsFailed(attachment.hash, result.failed);
      } else {
        await db.attachments.markAsFailed(attachment.id, undefined);
      }
    }
    refresh();
    setLoading(false);
  };

  const attachmentTypes = [
    {
      title: "All",
      filterBy: "all"
    },
    {
      title: "Images",
      filterBy: "images"
    },
    {
      title: "Documents",
      filterBy: "documents"
    },
    {
      title: "Video",
      filterBy: "video"
    },
    {
      title: "Audio",
      filterBy: "audio"
    }
  ];

  const filterAttachments = async (type: string) => {
    let items: FilteredSelector<Attachment> = db.attachments.all;

    switch (type) {
      case "all":
        items = db.attachments.all;
        break;
      case "images":
        items = note
          ? db.attachments.ofNote(note.id, "images")
          : db.attachments.images;
        break;
      case "video":
        items = items = note
          ? db.attachments.ofNote(note.id, "all")
          : db.attachments.videos;
        break;
      case "audio":
        items = db.attachments.all;
        break;
      case "documents":
        items = note
          ? db.attachments.ofNote(note.id, "all")
          : db.attachments.documents;
    }

    return await items.sorted({
      ...DEFAULT_SORTING,
      sortBy: "dateModified"
    });
  };

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12,
        height: height * 0.85
      }}
    >
      <SheetProvider context="attachments-list" />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Heading>Attachments</Heading>

        <View
          style={{
            flexDirection: "row"
          }}
        >
          {loading ? (
            <ActivityIndicator
              style={{
                height: 40,
                width: 40,
                marginRight: 10
              }}
              size={SIZE.lg}
            />
          ) : (
            <IconButton
              name="check-all"
              style={{
                height: 40,
                width: 40,
                marginRight: 10
              }}
              color={colors.primary.paragraph}
              size={SIZE.lg}
              onPress={onCheck}
            />
          )}

          <IconButton
            name="download"
            style={{
              height: 40,
              width: 40
            }}
            color={colors.primary.paragraph}
            onPress={() => {
              if (!attachments) return;
              DownloadAttachments.present(
                "attachments-list",
                attachments,
                !!note
              );
            }}
            size={SIZE.lg}
          />
        </View>
      </View>

      <Seperator />
      <Input
        placeholder="Filter attachments by filename, type or hash"
        onChangeText={onChangeText}
        onSubmit={() => {
          onChangeText(attachmentSearchValue.current as string);
        }}
      />

      <View>
        <ScrollView
          style={{
            width: "100%",
            height: 50,
            flexDirection: "row",
            backgroundColor: colors.primary.background
          }}
          contentContainerStyle={{
            minWidth: "100%",
            height: 50
          }}
          horizontal
        >
          {attachmentTypes.map((item) => (
            <Button
              type={
                currentFilter === item.filterBy ? "secondaryAccented" : "plain"
              }
              key={item.title}
              title={item.title}
              style={{
                borderRadius: 0,
                borderBottomWidth: 1,
                flexGrow: 1,
                borderBottomColor:
                  currentFilter !== item.filterBy
                    ? "transparent"
                    : colors.primary.accent
              }}
              onPress={async () => {
                setCurrentFilter(item.filterBy);
                setAttachments(await filterAttachments(item.filterBy));
              }}
            />
          ))}
        </ScrollView>
      </View>
      <FlashList
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        ListEmptyComponent={
          <View
            style={{
              height: 150,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Icon name="attachment" size={60} color={colors.secondary.icon} />
            <Paragraph>
              {note ? "No attachments on this note" : "No attachments"}
            </Paragraph>
          </View>
        }
        ListFooterComponent={
          <View
            style={{
              height: 350
            }}
          />
        }
        estimatedItemSize={50}
        data={attachments?.placeholders}
        renderItem={renderItem}
      />

      <Paragraph
        color={colors.secondary.paragraph}
        size={SIZE.xs}
        style={{
          textAlign: "center",
          marginTop: 10
        }}
      >
        <Icon
          name="shield-key-outline"
          size={SIZE.xs}
          color={colors.primary.icon}
        />
        {"  "}All attachments are end-to-end encrypted.
      </Paragraph>
    </View>
  );
};

AttachmentDialog.present = (note?: Note) => {
  presentSheet({
    component: () => <AttachmentDialog note={note} />
  });
};
