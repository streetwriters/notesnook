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

import { strings } from "@notesnook/intl";
import { ConfirmDialog } from "../../dialogs/confirm";
import { SaveState, useEditorStore } from "../../stores/editor-store";
import { showToast } from "../../utils/toast";
import { db } from "../../common/db";
import { NoteContent } from "@notesnook/core";

export const EDITOR_ZOOM = {
  DEFAULT: 100,
  MAX: 500,
  MIN: 30,
  STEP: 10
};

export const EDITOR_LINE_HEIGHT = {
  DEFAULT: 1.2,
  MAX: 10,
  MIN: 1
};

export async function closeTabs(
  tabs: { id: string; pinned?: boolean; sessionId: string }[]
) {
  const closableTabIds = [];
  for (const tab of tabs) {
    if (tab.pinned || !(await warnIfSessionNotSaved(tab.sessionId))) continue;
    closableTabIds.push(tab.id);
  }
  useEditorStore.getState().closeTabs(...closableTabIds);
}

export async function warnIfSessionNotSaved(sessionId: string) {
  const session = useEditorStore.getState().getSession(sessionId);
  if (
    !session ||
    session.type !== "default" ||
    session.needsHydration ||
    session.saveState === SaveState.Saved
  )
    return true;

  const result = await ConfirmDialog.show({
    title: strings.discardChanges(),
    message: strings.discardChangesDesc(),
    positiveButtonText: strings.discardChanges(),
    negativeButtonText: strings.cancel()
  });
  if (!result) return false;

  return true;
}

export async function isConflictingEdit(sessionId: string) {
  const session = useEditorStore.getState().getSession(sessionId);
  if (!session || !("note" in session)) return false;

  const dbNote = await db.notes.all
    .fields(["notes.id", "notes.dateEdited"])
    .find((e) => e("notes.id", "==", session.note.id));
  if (dbNote && dbNote.dateEdited !== session.note.dateEdited) {
    const result = await ConfirmDialog.show({
      title: strings.conflictDetected(),
      message: strings.conflictDetectedDesc(),
      positiveButtonText: strings.overwrite(),
      negativeButtonText: strings.cancel()
    });
    if (!result) {
      showToast("error", strings.saveConflictError());
      useEditorStore.getState().setSaveState(session.id, SaveState.NotSaved);
      return true;
    }
  }

  return false;
}

export async function saveContent(
  sessionId: string,
  partial: { content: NoteContent<false> } | { title: string }
) {
  if (await isConflictingEdit(sessionId)) return;

  const saveTimeout = setTimeout(() => {
    const { hide } = showToast(
      "warn",
      strings.savingNoteTakingTooLong(),
      [
        {
          text: strings.dismiss(),
          onClick: () => hide()
        }
      ],
      0
    );
  }, 30 * 1000);

  try {
    await useEditorStore.getState().saveSession(sessionId, partial);
  } catch (e) {
    if (e instanceof Error) showToast("error", e.message);
  } finally {
    clearTimeout(saveTimeout);
  }
}
