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
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import { presentSheet } from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import DialogHeader from "../dialog/dialog-header";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";
import { AttachmentItem } from "./attachment-item";
import { FlatList } from "react-native-actions-sheet";

export const AttachmentDialog = ({ data }) => {
  const colors = useThemeColors();
  const [note, setNote] = useState(data);
  const [attachments, setAttachments] = useState(
    data
      ? db.attachments.ofNote(data.id, "all")
      : [...(db.attachments.all || [])]
  );
  const attachmentSearchValue = useRef();
  const searchTimer = useRef();
  const [loading, setLoading] = useState(false);

  const onChangeText = (text) => {
    attachmentSearchValue.current = text;
    if (
      !attachmentSearchValue.current ||
      attachmentSearchValue.current === ""
    ) {
      setAttachments([...db.attachments.all]);
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      let results = db.lookup.attachments(
        db.attachments.all,
        attachmentSearchValue.current
      );
      if (results.length === 0) return;
      setAttachments(results);
    }, 300);
  };

  const renderItem = ({ item }) => (
    <AttachmentItem setAttachments={setAttachments} attachment={item} />
  );

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12
      }}
    >
      <DialogHeader
        title={note ? "Attachments" : "Manage attachments"}
        paragraph="Tap on an attachment to view properties"
        button={{
          title: "Check all",
          type: "grayAccent",
          loading: loading,
          onPress: async () => {
            setLoading(true);
            for (let attachment of attachments) {
              let result = await filesystem.checkAttachment(
                attachment.metadata.hash
              );
              if (result.failed) {
                db.attachments.markAsFailed(
                  attachment.metadata.hash,
                  result.failed
                );
              } else {
                db.attachments.markAsFailed(attachment.id, null);
              }
              setAttachments([...db.attachments.all]);
            }
            setLoading(false);
          }
        }}
      />
      <Seperator />
      {!note ? (
        <Input
          placeholder="Filter attachments by filename, type or hash"
          onChangeText={onChangeText}
          onSubmit={() => {
            onChangeText(attachmentSearchValue.current);
          }}
        />
      ) : null}

      <FlatList
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        windowSize={5}
        ListEmptyComponent={
          <View
            style={{
              height: 150,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Icon name="attachment" size={60} color={colors.icon} />
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
        data={attachments}
        keyExtractor={(item) => item.id}
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
        <Icon name="shield-key-outline" size={SIZE.xs} color={colors.primary.icon} />
        {"  "}All attachments are end-to-end encrypted.
      </Paragraph>
    </View>
  );
};

AttachmentDialog.present = (note) => {
  presentSheet({
    component: () => <AttachmentDialog data={note} />
  });
};
