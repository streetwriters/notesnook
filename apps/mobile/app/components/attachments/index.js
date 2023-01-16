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

import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import {
  eCloseAttachmentDialog,
  eOpenAttachmentsDialog
} from "../../utils/events";
import { SIZE } from "../../utils/size";
import DialogHeader from "../dialog/dialog-header";
import { Toast } from "../toast";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import SheetWrapper from "../ui/sheet";
import Paragraph from "../ui/typography/paragraph";
import { AttachmentItem } from "./attachment-item";
export const AttachmentDialog = () => {
  const colors = useThemeStore((state) => state.colors);
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState(null);
  const actionSheetRef = useRef();
  const [attachments, setAttachments] = useState([]);
  const attachmentSearchValue = useRef();
  const searchTimer = useRef();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    eSubscribeEvent(eOpenAttachmentsDialog, open);
    eSubscribeEvent(eCloseAttachmentDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenAttachmentsDialog, open);
      eUnSubscribeEvent(eCloseAttachmentDialog, close);
    };
  }, [visible]);

  const open = (data) => {
    if (data?.id) {
      setNote(data);
      let _attachments = db.attachments.ofNote(data.id, "all");
      setAttachments(_attachments);
    } else {
      setAttachments([...db.attachments.all]);
    }
    setVisible(true);
  };

  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    actionSheetRef.current?.hide();
    setVisible(false);
  };

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

  return !visible ? null : (
    <SheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      onClose={async () => {
        setVisible(false);
      }}
    >
      <Toast context="local" />
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
          nestedScrollEnabled
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
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
          color={colors.icon}
          size={SIZE.xs}
          style={{
            textAlign: "center",
            marginTop: 10
          }}
        >
          <Icon name="shield-key-outline" size={SIZE.xs} color={colors.icon} />
          {"  "}All attachments are end-to-end encrypted.
        </Paragraph>
      </View>
    </SheetWrapper>
  );
};
