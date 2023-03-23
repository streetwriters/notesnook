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
import { presentSheet, ToastEvent } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useAttachmentStore } from "../../../stores/use-attachment-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { openLinkInBrowser } from "../../../utils/functions";
import { SIZE } from "../../../utils/size";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const PublishNoteSheet = ({ note: item, update }) => {
  const colors = useThemeStore((state) => state.colors);
  const actionSheetRef = useRef();
  const loading = useAttachmentStore((state) => state.loading);
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [note, setNote] = useState(item);
  const [publishing, setPublishing] = useState(false);
  const publishUrl =
    note &&
    `https://monograph.notesnook.com/${db?.monographs.monograph(note?.id)}`;
  const isPublished = note && db?.monographs.isPublished(note?.id);
  const pwdInput = useRef();
  const passwordValue = useRef();

  const publishNote = async () => {
    if (publishing) return;
    setPublishLoading(true);

    try {
      if (note?.id) {
        if (isLocked && !passwordValue) return;
        await db.monographs.publish(note.id, {
          selfDestruct: selfDestruct,
          password: isLocked && passwordValue.current
        });
        setNote(db.notes.note(note.id)?.data);
        Navigation.queueRoutesForUpdate(
          "Notes",
          "Favorites",
          "ColoredNotes",
          "TaggedNotes",
          "TopicNotes"
        );
        setPublishLoading(false);
      }
    } catch (e) {
      ToastEvent.show({
        heading: "Could not publish note",
        message: e.message,
        type: "error",
        context: "local"
      });
    }

    setPublishLoading(false);
  };

  const setPublishLoading = (value) => {
    setPublishing(value);
    update({
      progress: value
    });
  };

  const deletePublishedNote = async () => {
    if (publishing) return;
    setPublishLoading(true);
    try {
      if (note?.id) {
        await db.monographs.unpublish(note.id);
        setNote(db.notes.note(note.id)?.data);
        Navigation.queueRoutesForUpdate(
          "Notes",
          "Favorites",
          "ColoredNotes",
          "TaggedNotes",
          "TopicNotes"
        );
        setPublishLoading(false);
      }
    } catch (e) {
      ToastEvent.show({
        heading: "Could not unpublish note",
        message: e.message,
        type: "error",
        context: "local"
      });
    }
    actionSheetRef.current?.hide();
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
          <ActivityIndicator size={25} color={colors.accent} />
          <Paragraph
            style={{
              textAlign: "center"
            }}
          >
            Please wait...
            {loading && loading.current && loading.total
              ? `\nDownloading attachments (${
                  loading?.current / loading?.total
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
                marginTop: 15,
                backgroundColor: colors.nav,
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
                <Heading size={SIZE.sm}>Published at:</Heading>
                <Paragraph size={SIZE.xs} numberOfLines={1}>
                  {publishUrl}
                </Paragraph>
                <Paragraph
                  onPress={async () => {
                    try {
                      await openLinkInBrowser(publishUrl, colors.accent);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  size={SIZE.xs}
                  style={{
                    marginTop: 5,
                    color: colors.pri
                  }}
                >
                  <Icon color={colors.accent} name="open-in-new" /> Open in
                  browser
                </Paragraph>
              </View>

              <IconButton
                onPress={() => {
                  Clipboard.setString(publishUrl);
                  ToastEvent.show({
                    heading: "Note publish url copied",
                    type: "success",
                    context: "local"
                  });
                }}
                color={colors.accent}
                size={SIZE.lg}
                name="content-copy"
              />
            </View>
          )}
          <Seperator />

          <TouchableOpacity
            onPress={() => {
              if (publishing) return;
              setIsLocked(!isLocked);
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 10
            }}
          >
            <IconButton
              onPress={() => {
                if (publishing) return;
                setIsLocked(!isLocked);
              }}
              color={isLocked ? colors.accent : colors.icon}
              size={SIZE.lg}
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
              alignItems: "center"
            }}
          >
            <IconButton
              onPress={() => {
                setSelfDestruct(!selfDestruct);
              }}
              color={selfDestruct ? colors.accent : colors.icon}
              size={SIZE.lg}
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

            <Button
              onPress={publishNote}
              fontSize={SIZE.md}
              width="100%"
              style={{
                marginTop: 10
              }}
              height={50}
              type="accent"
              title={isPublished ? "Update published note" : "Publish note"}
            />

            {isPublished && (
              <>
                <Seperator half />
                <Button
                  onPress={deletePublishedNote}
                  fontSize={SIZE.md}
                  width="100%"
                  height={50}
                  type="error"
                  title="Unpublish note"
                />
              </>
            )}
          </View>
        </>
      )}

      <Paragraph
        color={colors.icon}
        size={SIZE.xs}
        style={{
          textAlign: "center",
          marginTop: 5,
          textDecorationLine: "underline"
        }}
        onPress={async () => {
          try {
            await openLinkInBrowser(
              "https://docs.notesnook.com/monographs/",
              colors.accent
            );
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

PublishNoteSheet.present = (note) => {
  presentSheet({
    component: (ref, close, update) => (
      <PublishNoteSheet
        actionSheetRef={ref}
        close={close}
        update={update}
        note={note}
      />
    )
  });
};

export default PublishNoteSheet;
