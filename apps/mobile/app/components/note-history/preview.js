/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import Editor from "../../screens/editor";
import EditorOverlay from "../../screens/editor/loading";
import { editorController } from "../../screens/editor/tiptap/utils";
import { eSendEvent, ToastEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useEditorStore } from "../../stores/use-editor-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { eCloseProgressDialog, eOnLoadNote } from "../../utils/events";
import DialogHeader from "../dialog/dialog-header";
import { Button } from "../ui/button";
import Paragraph from "../ui/typography/paragraph";

export default function NotePreview({ session, content }) {
  const colors = useThemeStore((state) => state.colors);
  const editorId = ":noteHistory";

  async function restore() {
    await db.noteHistory.restore(session.id);
    if (useEditorStore.getState()?.currentEditingNote === session?.noteId) {
      if (editorController.current?.note) {
        eSendEvent(eOnLoadNote, {
          ...editorController.current?.note,
          forced: true
        });
      }
    }
    eSendEvent(eCloseProgressDialog, "note_history");
    eSendEvent(eCloseProgressDialog);
    Navigation.queueRoutesForUpdate(
      "Notes",
      "Favorites",
      "ColoredNotes",
      "TaggedNotes",
      "TopicNotes"
    );

    ToastEvent.show({
      heading: "Note restored successfully",
      type: "success"
    });
  }

  return (
    <View
      style={{
        height: session.locked ? null : 600,
        width: "100%"
      }}
    >
      <DialogHeader padding={12} title={session.session} />
      {!session.locked ? (
        <>
          <EditorOverlay editorId={editorId} />
          <Editor
            noHeader
            noToolbar
            readonly
            editorId={editorId}
            onLoad={() => {
              const note = db.notes.note(session.noteId)?.data;
              eSendEvent(eOnLoadNote + editorId, {
                ...note,
                content: {
                  ...content,
                  isPreview: true
                }
              });
            }}
          />
        </>
      ) : (
        <View
          style={{
            width: "100%",
            height: 100,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Paragraph color={colors.icon}>
            Preview not available, content is encrypted.
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
          title="Restore this version"
          type="accent"
          width="100%"
        />
      </View>
    </View>
  );
}
