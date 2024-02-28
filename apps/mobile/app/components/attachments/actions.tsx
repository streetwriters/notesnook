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

import { formatBytes } from "@notesnook/common";
import { Attachment, Note, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { RefObject, useEffect, useState } from "react";
import { View } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { ScrollView } from "react-native-gesture-handler";
import { db } from "../../common/database";
import filesystem from "../../common/filesystem";
import downloadAttachment from "../../common/filesystem/download-attachment";
import { useAttachmentProgress } from "../../hooks/use-attachment-progress";
import picker from "../../screens/editor/tiptap/picker";
import {
  ToastManager,
  eSendEvent,
  presentSheet
} from "../../services/event-manager";
import PremiumService from "../../services/premium";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import {
  eCloseAttachmentDialog,
  eCloseSheet,
  eDBItemUpdate
} from "../../utils/events";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Dialog } from "../dialog";
import { presentDialog } from "../dialog/functions";
import { openNote } from "../list-items/note/wrapper";
import { DateMeta } from "../properties/date-meta";
import { Button } from "../ui/button";
import { Notice } from "../ui/notice";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const Actions = ({
  attachment,
  close,
  setAttachments,
  fwdRef
}: {
  attachment: Attachment;
  setAttachments: (attachments?: VirtualizedGrouping<Attachment>) => void;
  close: () => void;
  fwdRef: RefObject<ActionSheetRef>;
}) => {
  const { colors } = useThemeColors();
  const contextId = attachment.hash;
  const [filename, setFilename] = useState(attachment.filename);
  const [currentProgress] = useAttachmentProgress(attachment);
  const [failed, setFailed] = useState<string | undefined>(attachment.failed);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<{
    name?: string;
  }>({});

  const actions = [
    {
      name: "Download",
      onPress: async () => {
        if (currentProgress) {
          await db.fs().cancel(attachment.hash);
          useAttachmentStore.getState().remove(attachment.hash);
        }
        downloadAttachment(attachment.hash, false);
        eSendEvent(eCloseSheet, contextId);
      },
      icon: "download"
    },
    {
      name: "Reupload",
      onPress: async () => {
        if (!PremiumService.get()) {
          ToastManager.show({
            heading: "Upgrade to pro",
            type: "error",
            context: "local"
          });
          return;
        }
        await picker.pick({
          reupload: true,
          hash: attachment.hash,
          context: contextId,
          type: attachment.type
        });
      },
      icon: "upload"
    },
    {
      name: "Run file check",
      onPress: async () => {
        setLoading({
          name: "Run file check"
        });
        const res = await filesystem.checkAttachment(attachment.hash);
        if (res.failed) {
          db.attachments.markAsFailed(attachment.id, res.failed);
          setFailed(res.failed);
          ToastManager.show({
            heading: "File check failed with error: " + res.failed,
            type: "error",
            context: "local"
          });
        } else {
          setFailed(undefined);
          db.attachments.markAsFailed(attachment.id);
          eSendEvent(eDBItemUpdate, attachment.id);
          ToastManager.show({
            heading: "File check passed",
            type: "success",
            context: "local"
          });
        }

        setAttachments();
        setLoading({
          name: undefined
        });
      },
      icon: "file-check"
    },
    {
      name: "Rename",
      onPress: () => {
        presentDialog({
          context: contextId as any,
          input: true,
          title: "Rename file",
          paragraph: "Enter a new name for the file",
          defaultValue: attachment.filename,
          positivePress: async (value) => {
            if (value && value.length > 0) {
              await db.attachments.add({
                hash: attachment.hash,
                filename: value
              });
              setFilename(value);
              setAttachments();
              eSendEvent(eDBItemUpdate, attachment.id);
            }
          },
          positiveText: "Rename"
        });
      },
      icon: "form-textbox"
    },
    {
      name: "Delete",
      onPress: async () => {
        await db.attachments.remove(attachment.hash, false);
        setAttachments();
        eSendEvent(eDBItemUpdate, attachment.id);
        close();
      },
      icon: "delete-outline"
    }
  ];

  useEffect(() => {
    db.relations
      .to(attachment, "note")
      .selector.items()
      .then((items) => {
        setNotes(items);
      });
  }, [attachment]);

  return (
    <ScrollView
      onMomentumScrollEnd={() => {
        fwdRef?.current?.handleChildScrollEnd();
      }}
      nestedScrollEnabled={true}
      style={{
        maxHeight: "100%"
      }}
    >
      <Dialog context={contextId} />
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.secondary.background,
          marginBottom: notes && notes.length > 0 ? 0 : 12
        }}
      >
        <Heading
          style={{
            paddingHorizontal: 12
          }}
          size={SIZE.lg}
        >
          {filename}
        </Heading>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 10,
            paddingHorizontal: 12
          }}
        >
          <Paragraph
            size={SIZE.xs}
            style={{
              marginRight: 10
            }}
            color={colors.secondary.paragraph}
          >
            {attachment.type}
          </Paragraph>
          <Paragraph
            style={{
              marginRight: 10
            }}
            size={SIZE.xs}
            color={colors.secondary.paragraph}
          >
            {formatBytes(attachment.size)}
          </Paragraph>

          {notes.length ? (
            <Paragraph
              style={{
                marginRight: 10
              }}
              size={SIZE.xs}
              color={colors.secondary.paragraph}
            >
              {notes.length} note
              {notes.length > 1 ? "s" : ""}
            </Paragraph>
          ) : null}
          <Paragraph
            onPress={() => {
              Clipboard.setString(attachment.hash);
              ToastManager.show({
                type: "success",
                heading: "Attachment hash copied",
                context: "local"
              });
            }}
            size={SIZE.xs}
            color={colors.secondary.paragraph}
          >
            {attachment.hash}
          </Paragraph>
        </View>

        <DateMeta item={attachment} />
      </View>

      {notes && notes.length > 0 ? (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.secondary.background,
            marginBottom: 12,
            paddingVertical: 12
          }}
        >
          <>
            <Heading
              style={{
                paddingHorizontal: 12
              }}
              size={SIZE.sm}
            >
              List of notes:
            </Heading>

            {notes.map((item) => (
              <Pressable
                onPress={async () => {
                  eSendEvent(eCloseSheet, contextId);
                  await sleep(150);
                  eSendEvent(eCloseAttachmentDialog);
                  await sleep(300);
                  openNote(item, (item as any).type === "trash");
                }}
                style={{
                  paddingVertical: 12,
                  alignItems: "flex-start",

                  paddingHorizontal: 12
                }}
                key={item.id}
              >
                <Paragraph size={SIZE.xs}>{item.title}</Paragraph>
              </Pressable>
            ))}
          </>
        </View>
      ) : null}

      {actions.map((item) => (
        <Button
          key={item.name}
          buttonType={{
            text:
              item.name === "Delete"
                ? colors.error.paragraph
                : colors.primary.paragraph
          }}
          onPress={item.onPress}
          title={item.name}
          icon={item.icon}
          loading={loading?.name === item.name}
          type="plain"
          fontSize={SIZE.sm}
          style={{
            borderRadius: 0,
            justifyContent: "flex-start",
            alignSelf: "flex-start",
            width: "100%"
          }}
        />
      ))}

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        {failed ? (
          <Notice
            type="alert"
            text={`File check failed with error: ${attachment.failed} Try reuploading the file to fix the issue.`}
            size="small"
          />
        ) : null}
      </View>
    </ScrollView>
  );
};

Actions.present = (
  attachment: Attachment,
  set: (attachments?: VirtualizedGrouping<Attachment>) => void,
  context?: string
) => {
  presentSheet({
    context: context,
    component: (ref, close) => (
      <Actions
        fwdRef={ref}
        setAttachments={set}
        close={close}
        attachment={attachment}
      />
    )
  });
};

export default Actions;
