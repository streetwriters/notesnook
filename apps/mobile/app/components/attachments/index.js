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

import React, { useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import { presentSheet } from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { AttachmentItem } from "./attachment-item";
import DownloadAttachments from "./download-attachments";
import { Button } from "../ui/button";
import {
  isAudio,
  isDocument,
  isImage,
  isVideo
} from "@notesnook/core/utils/filename";
import { useSettingStore } from "../../stores/use-setting-store";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";

export const AttachmentDialog = ({ note }) => {
  const { colors } = useThemeColors();
  const { height } = useSettingStore((state) => state.dimensions);
  const [attachments, setAttachments] = useState(
    note
      ? db.attachments.ofNote(note.id, "all")
      : [...(db.attachments.all || [])]
  );

  const attachmentSearchValue = useRef();
  const searchTimer = useRef();
  const [loading, setLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState("all");

  const onChangeText = (text) => {
    const attachments = note
      ? db.attachments.ofNote(note.id, "all")
      : [...(db.attachments.all || [])];

    attachmentSearchValue.current = text;
    if (
      !attachmentSearchValue.current ||
      attachmentSearchValue.current === ""
    ) {
      setAttachments([...attachments]);
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      let results = db.lookup.attachments(
        attachments,
        attachmentSearchValue.current
      );
      if (results.length === 0) return;
      setAttachments(results);
    }, 300);
  };

  const renderItem = ({ item }) => (
    <AttachmentItem
      setAttachments={setAttachments}
      attachment={item}
      context="attachments-list"
    />
  );

  const onCheck = async () => {
    setLoading(true);
    const checkedAttachments = [];
    for (let attachment of attachments) {
      let result = await filesystem.checkAttachment(attachment.metadata.hash);
      if (result.failed) {
        await db.attachments.markAsFailed(
          attachment.metadata.hash,
          result.failed
        );
      } else {
        await db.attachments.markAsFailed(attachment.id, null);
      }
      checkedAttachments.push(
        db.attachments.attachment(attachment.metadata.hash)
      );
      setAttachments([...checkedAttachments]);
    }
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

  const filterAttachments = (type) => {
    const attachments = note
      ? db.attachments.ofNote(note.id, "all")
      : [...(db.attachments.all || [])];
    isDocument;
    switch (type) {
      case "all":
        return attachments;
      case "images":
        return attachments.filter((attachment) =>
          isImage(attachment.metadata.type)
        );
      case "video":
        return attachments.filter((attachment) =>
          isVideo(attachment.metadata.type)
        );
      case "audio":
        return attachments.filter((attachment) =>
          isAudio(attachment.metadata.type)
        );
      case "documents":
        return attachments.filter((attachment) =>
          isDocument(attachment.metadata.type)
        );
    }
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
              customStyle={{
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
            customStyle={{
              height: 40,
              width: 40
            }}
            color={colors.primary.paragraph}
            onPress={() => {
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
          onChangeText(attachmentSearchValue.current);
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
              type={currentFilter === item.filterBy ? "grayAccent" : "gray"}
              key={item.title}
              title={
                item.title +
                ` (${filterAttachments(item.filterBy)?.length || 0})`
              }
              style={{
                borderRadius: 0,
                borderBottomWidth: 1,
                flexGrow: 1,
                borderBottomColor:
                  currentFilter !== item.filterBy
                    ? "transparent"
                    : colors.primary.accent
              }}
              onPress={() => {
                setCurrentFilter(item.filterBy);
                setAttachments(filterAttachments(item.filterBy));
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
        data={attachments}
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

AttachmentDialog.present = (note) => {
  presentSheet({
    component: () => <AttachmentDialog note={note} />
  });
};
