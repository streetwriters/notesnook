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

import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { ReadonlyEditor } from "../../screens/editor/readonly-editor";
import { useTabStore } from "../../screens/editor/tiptap/use-tab-store";
import { editorController } from "../../screens/editor/tiptap/utils";
import { ToastManager, eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useTrashStore } from "../../stores/use-trash-store";
import { eCloseSheet, eOnLoadNote } from "../../utils/events";
import { Dialog } from "../dialog";
import DialogHeader from "../dialog/dialog-header";
import { presentDialog } from "../dialog/functions";
import { Button } from "../ui/button";
import Paragraph from "../ui/typography/paragraph";
import { diff } from "diffblazer";
import { strings } from "@notesnook/intl";

/**
 *
 * @param {any} param0
 * @returns
 */
export default function NotePreview({ session, content, note }) {
  const { colors } = useThemeColors();
  const [locked, setLocked] = useState(false);

  async function restore() {
    if (note && note.type === "trash") {
      if ((await db.trash.restore(note.id)) === false) return;
      Navigation.queueRoutesForUpdate();
      useSelectionStore.getState().setSelectionMode(false);
      ToastManager.show({
        heading: strings.noteRestored(),
        type: "success"
      });
      eSendEvent(eCloseSheet);
      return;
    }
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
    eSendEvent(eCloseSheet);
    Navigation.queueRoutesForUpdate();

    ToastManager.show({
      heading: strings.noteRestoredFromHistory(),
      type: "success"
    });
  }

  useEffect(() => {
    db.vaults.itemExists(note).then((locked) => setLocked(locked));
  }, [note]);

  const deleteNote = async () => {
    presentDialog({
      title: strings.deleteNote(),
      paragraph: strings.deleteNoteConfirmation(),
      positiveText: strings.delete(),
      negativeText: strings.cancel(),
      context: "local",
      positivePress: async () => {
        await db.trash.delete(note.id);
        useTrashStore.getState().refresh();
        useSelectionStore.getState().setSelectionMode(false);
        ToastManager.show({
          heading: strings.noteDeleted(),
          type: "success",
          context: "local"
        });
        eSendEvent(eCloseSheet);
      },
      positiveType: "error"
    });
  };

  return (
    <View
      style={{
        height: locked || session?.locked ? null : 600,
        width: "100%"
      }}
    >
      <Dialog context="local" />
      <DialogHeader padding={12} title={note?.title || session?.session} />
      {!session?.locked && !locked ? (
        <View
          style={{
            flex: 1
          }}
        >
          <ReadonlyEditor
            editorId="historyPreview"
            onLoad={async (loadContent) => {
              try {
                if (content.data) {
                  const _note = note || (await db.notes.note(session?.noteId));
                  const currentContent = await db.content.get(_note.contentId);
                  loadContent({
                    data: diff(currentContent.data, content.data),
                    id: _note.id
                  });
                }
              } catch (e) {
                ToastManager.error(
                  e,
                  "Failed to load history preview",
                  "local"
                );
              }
            }}
          />
        </View>
      ) : (
        <View
          style={{
            width: "100%",
            height: 100,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Paragraph color={colors.secondary.paragraph}>
            {strings.encryptedNoteHistoryNotice()}
          </Paragraph>
        </View>
      )}

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <Button
          onPress={restore}
          title={strings.restore()}
          type="accent"
          width="100%"
        />
        <Button
          onPress={deleteNote}
          title={strings.deletePermanently()}
          type="error"
          width="100%"
          style={{
            marginTop: 12
          }}
        />
      </View>
    </View>
  );
}
