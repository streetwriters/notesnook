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

import Clipboard from "@react-native-clipboard/clipboard";
import React, { useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useAttachmentStore } from "../../../stores/use-attachment-store";
import { useThemeColors } from "@notesnook/theme";
import { openLinkInBrowser } from "../../../utils/functions";
import { SIZE } from "../../../utils/size";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { requestInAppReview } from "../../../services/app-review";
import { Note } from "@notesnook/core";

const PublishNoteSheet = ({
  note: item
}: {
  note: Note;
  close?: (ctx?: string) => void;
}) => {
  const { colors } = useThemeColors();

  const attachmentDownloads = useAttachmentStore((state) => state.downloading);
  const downloading = attachmentDownloads?.[`monograph-${item.id}`];
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [note, setNote] = useState<Note | undefined>(item);
  const [publishing, setPublishing] = useState(false);
  const publishUrl =
    note && `https://monogr.ph/${db.monographs.monograph(note?.id)}`;
  const isPublished = note && db.monographs.isPublished(note?.id);
  const pwdInput = useRef(null);
  const passwordValue = useRef<string>();

  const publishNote = async () => {
    if (publishing) return;
    setPublishLoading(true);

    try {
      if (note?.id) {
        if (isLocked && !passwordValue.current) return;
        await db.monographs.publish(note.id, {
          selfDestruct: selfDestruct,
          password: isLocked ? passwordValue.current : undefined
        });
        setNote(await db.notes.note(note.id));
        Navigation.queueRoutesForUpdate();
        setPublishLoading(false);
      }
      requestInAppReview();
    } catch (e) {
      ToastManager.show({
        heading: "Could not publish note",
        message: (e as Error).message,
        type: "error",
        context: "local"
      });
    }

    setPublishLoading(false);
  };

  const setPublishLoading = (value: boolean) => {
    setPublishing(value);
  };

  const deletePublishedNote = async () => {
    if (publishing) return;
    setPublishLoading(true);
    try {
      if (note?.id) {
        await db.monographs.unpublish(note.id);
        setNote(await db.notes.note(note.id));
        Navigation.queueRoutesForUpdate();
        setPublishLoading(false);
      }
    } catch (e) {
      ToastManager.show({
        heading: "Could not unpublish note",
        message: (e as Error).message,
        type: "error",
        context: "local"
      });
    }
    setPublishLoading(false);
  };

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: 12
      }}
    >
      <DialogHeader
        title={note?.title}
        paragraph={`Anyone with the link${
          isLocked ? " and password" : ""
        } of the published note can view it.`}
      />

      {publishing ? (
        <View
          style={{
            justifyContent: "center",
            alignContent: "center",
            height: 150,
            width: "100%"
          }}
        >
          <ActivityIndicator size={25} color={colors.primary.accent} />
          <Paragraph
            style={{
              textAlign: "center"
            }}
          >
            Please wait...
            {downloading && downloading.current && downloading.total
              ? `\nDownloading attachments (${
                  downloading?.current / downloading?.total
                })`
              : ""}
          </Paragraph>
        </View>
      ) : (
        <>
          {isPublished && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
                backgroundColor: colors.secondary.background,
                padding: 12,
                borderRadius: 5
              }}
            >
              <View
                style={{
                  width: "100%",
                  flexShrink: 1
                }}
              >
                <Heading size={SIZE.md}>Published at:</Heading>
                <Paragraph size={SIZE.sm} numberOfLines={1}>
                  {publishUrl}
                </Paragraph>
                <Paragraph
                  onPress={async () => {
                    try {
                      await openLinkInBrowser(publishUrl);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  size={SIZE.xs}
                  style={{
                    marginTop: 5,
                    color: colors.primary.paragraph
                  }}
                >
                  <Icon color={colors.primary.accent} name="open-in-new" /> Open
                  in browser
                </Paragraph>
              </View>

              <IconButton
                onPress={() => {
                  Clipboard.setString(publishUrl as string);
                  ToastManager.show({
                    heading: "Note publish url copied",
                    type: "success",
                    context: "local"
                  });
                }}
                color={colors.primary.accent}
                size={SIZE.lg}
                name="content-copy"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={() => {
              if (publishing) return;
              setIsLocked(!isLocked);
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10,
              backgroundColor: colors.secondary.background,
              paddingVertical: 12,
              borderRadius: 5,
              marginTop: 10
            }}
          >
            <IconButton
              onPress={() => {
                if (publishing) return;
                setIsLocked(!isLocked);
              }}
              color={isLocked ? colors.selected.icon : colors.primary.icon}
              size={SIZE.xl}
              name={
                isLocked
                  ? "check-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
            />

            <View
              style={{
                width: "100%",
                flexShrink: 1
              }}
            >
              <Heading size={SIZE.md}>Password protection</Heading>
              <Paragraph>
                Published note can only be viewed by someone with the password.
              </Paragraph>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelfDestruct(!selfDestruct);
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.secondary.background,
              paddingVertical: 12,
              borderRadius: 5
            }}
          >
            <IconButton
              onPress={() => {
                setSelfDestruct(!selfDestruct);
              }}
              color={selfDestruct ? colors.selected.icon : colors.primary.icon}
              size={SIZE.xl}
              name={
                selfDestruct
                  ? "check-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
            />

            <View
              style={{
                width: "100%",
                flexShrink: 1
              }}
            >
              <Heading size={SIZE.md}>Self destruct</Heading>
              <Paragraph>
                Published note link will be automatically deleted once it is
                viewed by someone.
              </Paragraph>
            </View>
          </TouchableOpacity>

          <View
            style={{
              width: "100%",
              alignSelf: "center",
              marginTop: 10
            }}
          >
            {isLocked ? (
              <>
                <Input
                  fwdRef={pwdInput}
                  onChangeText={(value) => (passwordValue.current = value)}
                  blurOnSubmit
                  secureTextEntry
                  defaultValue={passwordValue.current}
                  placeholder="Enter Password"
                />
                <Seperator half />
              </>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                width: "100%",
                justifyContent: "center"
              }}
            >
              {isPublished && (
                <>
                  <Button
                    onPress={deletePublishedNote}
                    fontSize={SIZE.md}
                    type="error"
                    title="Unpublish"
                    style={{
                      width: "49%"
                    }}
                  />
                </>
              )}
              <Seperator half />
              <Button
                onPress={publishNote}
                fontSize={SIZE.md}
                style={{
                  width: isPublished ? "49%" : 250,
                  borderRadius: isPublished ? 5 : 100
                }}
                type="accent"
                title={isPublished ? "Update" : "Publish"}
              />
            </View>
          </View>
        </>
      )}

      <Paragraph
        color={colors.secondary.paragraph}
        size={SIZE.xs}
        style={{
          textAlign: "center",
          marginTop: 10,
          textDecorationLine: "underline"
        }}
        onPress={async () => {
          try {
            await openLinkInBrowser("https://docs.notesnook.com/monographs/");
          } catch (e) {
            console.error(e);
          }
        }}
      >
        Learn more about Notesnook Monograph
      </Paragraph>
    </View>
  );
};

PublishNoteSheet.present = (note: Note) => {
  presentSheet({
    component: (ref, close, update) => (
      <PublishNoteSheet close={close} note={note} />
    )
  });
};

export default PublishNoteSheet;
