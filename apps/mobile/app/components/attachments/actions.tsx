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
import { useTabStore } from "../../screens/editor/tiptap/use-tab-store";
import { editorController } from "../../screens/editor/tiptap/utils";
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
  eDBItemUpdate,
  eOnLoadNote
} from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Dialog } from "../dialog";
import { presentDialog } from "../dialog/functions";
import { openNote } from "../list-items/note/wrapper";
import { DateMeta } from "../properties/date-meta";
import SheetProvider from "../sheet-provider";
import { Button } from "../ui/button";
import { Notice } from "../ui/notice";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

const Actions = ({
  attachment,
  close,
  setAttachments,
  fwdRef,
  context
}: {
  attachment: Attachment;
  context: string;
  setAttachments: (attachments?: VirtualizedGrouping<Attachment>) => void;
  close?: () => void;
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
      name: strings.network.download(),
      onPress: async () => {
        if (currentProgress) {
          await db.fs().cancel(attachment.hash);
          useAttachmentStore.getState().remove(attachment.hash);
        }
        downloadAttachment(attachment.hash, context === "global");
        fwdRef.current?.hide();
      },
      icon: "download"
    },
    {
      name: strings.network.reupload(),
      onPress: async () => {
        if (!PremiumService.get()) {
          ToastManager.show({
            heading: strings.upgradeToPro(),
            type: "error",
            context: "local"
          });
          return;
        }
        await picker.pick({
          reupload: true,
          hash: attachment.hash,
          context: contextId,
          type: attachment.mimeType.startsWith("image") ? "image" : "file"
        });
      },
      icon: "upload"
    },
    {
      name: strings.fileCheck(),
      onPress: async () => {
        setLoading({
          name: strings.fileCheck()
        });
        const result = await filesystem.checkAttachment(attachment.hash);
        if (!result) return;

        if (result.failed) {
          db.attachments.markAsFailed(attachment.id, result.failed);
          setFailed(result.failed);
          ToastManager.show({
            heading: strings.fileCheckFailed(result.failed),
            type: "error",
            context: "local"
          });
        } else {
          setFailed(undefined);
          db.attachments.markAsFailed(attachment.id);
          eSendEvent(eDBItemUpdate, attachment.id);
          ToastManager.show({
            heading: strings.fileCheckPassed(),
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
      name: strings.rename(),
      onPress: () => {
        presentDialog({
          input: true,
          title: strings.renameFile(),
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
          positiveText: strings.rename()
        });
      },
      icon: "form-textbox"
    },
    {
      name: strings.delete(),
      onPress: async () => {
        const relations = await db.relations.to(attachment, "note").get();
        await db.attachments.remove(attachment.hash, false);
        setAttachments();
        eSendEvent(eDBItemUpdate, attachment.id);
        relations
          .map((relation) => relation.fromId)
          .forEach(async (id) => {
            useTabStore.getState().forEachNoteTab(id, async (tab) => {
              const isFocused = useTabStore.getState().currentTab === tab.id;
              if (isFocused) {
                eSendEvent(eOnLoadNote, {
                  item: await db.notes.note(id),
                  forced: true
                });
              } else {
                editorController.current.commands.setLoading(true, tab.id);
              }
            });
          });
        close?.();
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
      keyboardShouldPersistTaps="never"
    >
      <Dialog context={contextId} />
      <SheetProvider context={contextId} />
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.border,
          marginBottom: notes && notes.length > 0 ? 0 : 12
        }}
      >
        <Heading
          style={{
            paddingHorizontal: 12
          }}
          size={AppFontSize.lg}
        >
          {filename}
        </Heading>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 10,
            paddingHorizontal: 12,
            marginTop: 6,
            gap: 10
          }}
        >
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {attachment.mimeType}
          </Paragraph>
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {formatBytes(attachment.size)}
          </Paragraph>

          {notes.length ? (
            <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
              {strings.notes(notes.length)}
            </Paragraph>
          ) : null}
          <Paragraph
            onPress={() => {
              Clipboard.setString(attachment.hash);
              ToastManager.show({
                type: "success",
                heading: strings.hashCopied(),
                context: "local"
              });
            }}
            size={AppFontSize.xs}
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
            borderBottomColor: colors.primary.border,
            marginBottom: 12,
            paddingVertical: 12
          }}
        >
          <>
            <Heading
              style={{
                paddingHorizontal: 12
              }}
              size={AppFontSize.sm}
            >
              {strings.listOf()} {strings.dataTypesPlural.note()}:
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
                <Paragraph size={AppFontSize.xs}>{item.title}</Paragraph>
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
          fontSize={AppFontSize.sm}
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
            text={strings.fileCheckFailed(failed)}
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
        context={context || "global"}
      />
    )
  });
};

export default Actions;
