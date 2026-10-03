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

import { getFormattedDate, getTimeAgo } from "@notesnook/common";
import { NoteContent, isEncryptedContent } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { diff } from "diffblazer";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Radius, Spacing } from "../../common/design/spacing";
import { db } from "../../common/database";
import { Dialog } from "../../components/dialog";
import { presentDialog } from "../../components/dialog/functions";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager, eSendEvent } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useTrashStore } from "../../stores/use-trash-store";
import { eCloseSheet, eOnLoadNote } from "../../utils/events";
import { ReadonlyEditor } from "../editor/readonly-editor";
import { useTabStore } from "../editor/tiptap/use-tab-store";
import { editorController } from "../editor/tiptap/utils";

const NotePreview = (props: NavigationProps<"NotePreview">) => {
  const { note, session } = props.route.params;
  const { colors } = useThemeColors();
  const [locked, setLocked] = useState(false);
  const [content, setContent] = useState<
    Partial<NoteContent<boolean> & { title: string }> | undefined
  >();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.vaults.itemExists(note).then((locked) => setLocked(locked));
  }, [note]);

  useEffect(() => {
    (async () => {
      try {
        if (session) {
          setContent(await db.noteHistory.content(session.id));
        } else if (note.contentId) {
          setContent(await db.content.get(note.contentId));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [note.contentId, session]);

  async function restore() {
    if (note && note.type === "trash") {
      await db.trash.restore(note.id);
      Navigation.queueRoutesForUpdate();
      useSelectionStore.getState().setSelectionMode();
      ToastManager.show({
        heading: strings.noteRestored(),
        type: "success"
      });
      Navigation.goBack();
      return;
    }
    if (session) {
      await db.noteHistory.restore(session.id);
      if (useTabStore.getState().hasTabForNote(session?.noteId)) {
        const note = editorController.current.note.current[session?.noteId];
        if (note) {
          eSendEvent(eOnLoadNote, {
            item: note,
            forced: true
          });
        }
      }
      eSendEvent(eCloseSheet, "note_history");
      Navigation.queueRoutesForUpdate();

      ToastManager.show({
        heading: strings.noteRestoredFromHistory(),
        type: "success"
      });
      Navigation.goBack();
    }
  }

  const deleteNote = async () => {
    presentDialog({
      title: strings.deleteNote(),
      paragraph: strings.deleteNoteConfirmation(),
      positiveText: strings.delete(),
      negativeText: strings.cancel(),
      context: "local",
      positivePress: async () => {
        if (note) {
          await db.trash.delete(note.id);
          useTrashStore.getState().refresh();
          useSelectionStore.getState().setSelectionMode();
          ToastManager.show({
            heading: strings.noteDeleted(),
            type: "success",
            context: "local"
          });
          Navigation.goBack();
        }
      },
      positiveType: "error"
    });
  };

  const canPreview = !session?.locked && !locked && !!content?.data;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary.background }}
    >
      <Dialog context="local" />
      <Header
        renderedInRoute="NotePreview"
        id="NotePreview"
        title={session ? strings.historyDetail() : note.title}
        style={{ backgroundColor: colors.primary.background }}
        canGoBack
      />

      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_2
        }}
      >
        {session ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.LEVEL_1,
              padding: Spacing.LEVEL_2,
              borderRadius: Radius.XS,
              backgroundColor: colors.selected.background
            }}
          >
            <AppIcon
              name="clock"
              iconFamily="notesnook"
              size={20}
              color={colors.primary.icon}
            />
            <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
              <Paragraph fontSize="XS" color={colors.primary.heading}>
                {getFormattedDate(session.dateCreated, "date")}
              </Paragraph>
              <Paragraph fontSize="XS" color={colors.primary.paragraph}>
                {`${getFormattedDate(
                  session.dateCreated,
                  "time"
                )} - ${getFormattedDate(session.dateModified + 60000, "time")}`}
              </Paragraph>
            </View>
            <View
              style={{
                backgroundColor: colors.primary.background,
                paddingHorizontal: Spacing.LEVEL_1,
                paddingVertical: Spacing.LEVEL_0,
                borderRadius: 50
              }}
            >
              <Paragraph fontSize="XXS" color={colors.primary.heading}>
                {getTimeAgo(session.dateModified)}
              </Paragraph>
            </View>
          </View>
        ) : null}

        <Paragraph
          fontFamily="MEDIUM"
          fontSize="SM"
          color={colors.secondary.paragraph}
        >
          {strings.noteContent()}
        </Paragraph>

        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.secondary.border,
            borderRadius: Radius.XS,
            padding: Spacing.LEVEL_2,
            overflow: "hidden"
          }}
        >
          {canPreview ? (
            <ReadonlyEditor
              editorId="historyPreview"
              onLoad={async (loadContent) => {
                try {
                  if (content?.data) {
                    const currentContent = note?.contentId
                      ? await db.content.get(note.contentId)
                      : undefined;

                    if (
                      currentContent?.data &&
                      !isEncryptedContent(currentContent)
                    ) {
                      loadContent({
                        data: diff(
                          currentContent?.data || "<p></p>",
                          content.data as string
                        ),
                        id: session?.noteId || note.id
                      });
                    }
                  }
                } catch (e) {
                  ToastManager.error(
                    e as Error,
                    "Failed to load history preview",
                    "local"
                  );
                }
              }}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Paragraph color={colors.secondary.paragraph}>
                {loading
                  ? ""
                  : !content?.data
                    ? strings.noContent()
                    : strings.encryptedNoteHistoryNotice()}
              </Paragraph>
            </View>
          )}
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          paddingVertical: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_2,
          marginTop: Spacing.LEVEL_1
        }}
      >
        <Button
          onPress={restore}
          title={session ? strings.restoreThisVersion() : strings.restore()}
          type="accent"
          width="100%"
        />
        <Button
          onPress={deleteNote}
          title={strings.deletePermanently()}
          type="error-outline"
          width="100%"
        />
        <Paragraph
          fontSize="SM"
          color={colors.secondary.paragraph}
          style={{ alignSelf: "center" }}
        >
          {strings.deletedVersionsCannotBeRecovered()}
        </Paragraph>
      </View>
    </SafeAreaView>
  );
};

export default NotePreview;
