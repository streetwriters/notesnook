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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { RefObject, useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { ActionSheetRef } from "react-native-actions-sheet";
import { ScrollView } from "react-native-gesture-handler";
import { db } from "../../common/database";
import { Radius, Spacing } from "../../common/design/spacing";
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
import Navigation from "../../services/navigation";
import PremiumService from "../../services/premium";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import {
  eCloseAttachmentDialog,
  eCloseSheet,
  eDBItemUpdate,
  eOnLoadNote
} from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Dialog } from "../dialog";
import { presentDialog } from "../dialog/functions";
import { openNote } from "../list-items/note/wrapper";
import { DateMeta } from "../properties/date-meta";
import SheetProvider from "../sheet-provider";
import AppIcon from "../ui/AppIcon";
import { createFormRef, validators } from "../ui/input/form-input";
import { Notice } from "../ui/notice";
import { Pressable } from "../ui/pressable";
import LineSeparator from "../ui/seperator/line-separator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

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
      icon: "download-simple"
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
      icon: "upload-simple"
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
      icon: "file"
    },
    {
      name: strings.rename(),
      onPress: () => {
        close?.();
        setTimeout(() => {
          presentDialog({
            title: strings.renameFile(),
            form: {
              formRef: createFormRef({
                name: attachment.filename
              }),
              items: [
                {
                  name: "name",
                  defaultValue: attachment.filename,
                  placeholder: strings.enterTitle(),
                  ref: React.createRef<TextInput | null>(),
                  validators: [validators.required(strings.nameIsRequired())]
                }
              ],
              onFormSubmit: async (form) => {
                try {
                  const value = form.getValue("name");
                  await db.attachments.add({
                    hash: attachment.hash,
                    filename: value
                  });
                  setFilename(value);
                  setAttachments();
                  eSendEvent(eDBItemUpdate, attachment.id);
                  ToastManager.show({
                    message: `Attachment renamed to ${value}`,
                    type: "success"
                  });

                  return true;
                } catch (e) {
                  form.setError("name", (e as Error).message);
                  return false;
                }
              }
            },
            positiveText: strings.rename()
          });
        }, 500);
      },
      icon: "pencil-simple"
    },
    {
      name: strings.delete(),
      onPress: async () => {
        close?.();
        setTimeout(() => {
          presentDialog({
            title: strings.deleteAttachment(),
            paragraph: strings.deleteAttachmentConfirm(),
            positiveText: strings.yes(),
            negativeText: strings.no(),
            positiveType: "errorShade",
            positivePress: async () => {
              try {
                const relations = await db.relations
                  .to(attachment, "note")
                  .get();
                await db.attachments.remove(attachment.hash, false);
                ToastManager.show({
                  type: "success",
                  message: strings.attachmentDeleted()
                });
                setAttachments();
                eSendEvent(eDBItemUpdate, attachment.id);
                relations
                  .map((relation) => relation.fromId)
                  .forEach(async (id) => {
                    useTabStore.getState().forEachNoteTab(id, async (tab) => {
                      const isFocused =
                        useTabStore.getState().currentTab === tab.id;
                      if (isFocused) {
                        eSendEvent(eOnLoadNote, {
                          item: await db.notes.note(id),
                          forced: true
                        });
                      } else {
                        editorController.current.commands.setLoading(
                          true,
                          tab.id
                        );
                      }
                    });
                  });
                return true;
              } catch (e) {
                return false;
              }
            }
          });
        }, 500);
      },
      icon: "trash"
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
      bounces={false}
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
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_4,
          gap: Spacing.LEVEL_1
        }}
      >
        <Heading fontSize="LG">{filename}</Heading>

        <View
          style={{
            flexDirection: "row",
            gap: Spacing.LEVEL_1,
            alignItems: "center"
          }}
        >
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {attachment.mimeType}
          </Paragraph>
          <Paragraph fontSize="XS">•</Paragraph>
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {formatBytes(attachment.size)}
          </Paragraph>
          <Paragraph fontSize="XS">•</Paragraph>
          {notes.length ? (
            <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
              {strings.notes(notes.length)}
            </Paragraph>
          ) : null}
          <Paragraph fontSize="XS">•</Paragraph>
          <Paragraph
            onPress={() => {
              Clipboard.setString(attachment.hash);
              ToastManager.show({
                type: "success",
                heading: strings.hashCopied(),
                context: "local"
              });
            }}
            fontSize="XS"
            color={colors.secondary.paragraph}
          >
            <AppIcon
              name="copy"
              size={10}
              color={colors.secondary.paragraph}
              iconFamily="notesnook"
            />{" "}
            {attachment.hash}
          </Paragraph>
        </View>

        <LineSeparator paddingVertical={Spacing.LEVEL_2} />

        <DateMeta item={attachment} />
      </View>

      {notes && notes.length > 0 ? (
        <>
          <LineSeparator
            paddingHorizontal={Spacing.LEVEL_3}
            paddingVertical={Spacing.LEVEL_3}
          />
          <View
            style={{
              paddingHorizontal: Spacing.LEVEL_3,
              gap: Spacing.LEVEL_2
            }}
          >
            <>
              <Heading size={AppFontSize.sm}>
                {strings.notes(notes.length)}
              </Heading>

              {notes.map((item) => (
                <Pressable
                  onPress={async () => {
                    eSendEvent(eCloseSheet, contextId);
                    close?.();
                    eSendEvent(eCloseAttachmentDialog);
                    Navigation.navigate("FluidPanelsView");
                    openNote(item, (item as any).type === "trash");
                  }}
                  style={{
                    alignItems: "flex-start"
                  }}
                  key={item.id}
                >
                  <Paragraph fontSize="XS">{item.title}</Paragraph>
                </Pressable>
              ))}
            </>
          </View>
        </>
      ) : null}

      <LineSeparator
        paddingHorizontal={Spacing.LEVEL_3}
        paddingVertical={Spacing.LEVEL_3}
      />

      <View
        style={{
          gap: Spacing.LEVEL_2
        }}
      >
        {actions.map((item) => (
          <Pressable
            key={item.name}
            onPress={item.onPress}
            type="plain"
            style={{
              borderRadius: 0,
              flexDirection: "row",
              width: "100%",
              gap: Spacing.LEVEL_1,
              justifyContent: "flex-start",
              paddingHorizontal: Spacing.LEVEL_3
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                backgroundColor: colors.secondary.background,
                borderRadius: Radius.XS,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <AppIcon
                color={
                  item.icon === "trash"
                    ? colors.error.accent
                    : colors.primary.icon
                }
                name={item.icon}
                iconFamily="notesnook"
                size={16}
              />
            </View>

            <Paragraph
              color={
                item.icon === "trash"
                  ? colors.error.accent
                  : colors.primary.heading
              }
              fontSize="SM"
              fontFamily="MEDIUM"
            >
              {item.name}
            </Paragraph>
          </Pressable>
        ))}
      </View>

      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP
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
