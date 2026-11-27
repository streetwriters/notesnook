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

import { memo, useEffect, useRef, useState } from "react";
import { debounceWithId } from "@notesnook/common";
import { NEWLINE_STRIP_REGEX } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Textarea } from "@notesnook/ui-kit";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { replaceDateTime } from "../../utils/replace-date-time";
import { useEditorConfig, useEditorManager } from "./manager";

type TitleBoxProps = {
  id: string;
  readonly: boolean;
};

// The title typed but not yet saved. The store's title only replaces the input
// when nothing is pending, and an earlier save finishing must not clear a newer
// title: that would revert the input to the older title and drop keystrokes.
type PendingTitle = { current: string | undefined };

async function onTitleChange(noteId: string, title: string, pending: PendingTitle) {
  await useEditorStore.getState().setTitle(noteId, title);
  if (pending.current === title) pending.current = undefined;
}

const debouncedOnTitleChange = debounceWithId(onTitleChange, 100);

function TitleBox(props: TitleBoxProps) {
  const { readonly, id } = props;
  const pendingChanges = useRef<string | undefined>(undefined);
  const sessionType = useEditorStore((store) => store.getSession(id)?.type);
  const storedTitle = useEditorStore((store) => {
    const session = store.getSession(id);
    return session && "note" in session ? session.note?.title ?? "" : "";
  });
  const [title, setTitle] = useState(storedTitle);
  const { editorConfig } = useEditorConfig();
  const dateFormat = useSettingsStore((store) => store.dateFormat);
  const timeFormat = useSettingsStore((store) => store.timeFormat);

  useEffect(() => {
    if (pendingChanges.current !== undefined) return;
    setTitle(storedTitle);
  }, [sessionType, id, storedTitle]);

  useEffect(() => {
    const { unsubscribe } = AppEventManager.subscribe(
      AppEvents.changeNoteTitle,
      ({
        preventSave,
        title,
        sessionId
      }: {
        title: string;
        preventSave: boolean;
        sessionId: string;
      }) => {
        if (sessionId !== id) return;
        setTitle(title);
        if (!preventSave) {
          pendingChanges.current = title;
          debouncedOnTitleChange(sessionId, sessionId, title, pendingChanges);
        }
      }
    );
    return () => {
      unsubscribe();
    };
  }, [id]);

  return (
    <Textarea
      data-test-id="editor-title"
      variant="clean"
      value={title}
      placeholder={strings.noteTitle()}
      readOnly={readonly}
      rows={1}
      sx={{
        m: 0,
        py: 1,
        px: 0,
        fontFamily:
          editorConfig.fontFamily === "monospace" ? "monospace" : "heading",
        fontSize: 28.8,
        lineHeight: 35,
        fontWeight: "heading",
        width: "100%"
      }}
      onChange={({ target: { value: text } }) => {
        const submitted = /[\r\n]/.test(text);
        const next = replaceDateTime(text, dateFormat, timeFormat).replace(
          NEWLINE_STRIP_REGEX,
          " "
        );
        pendingChanges.current = next;
        setTitle(next);
        debouncedOnTitleChange(id, id, next, pendingChanges);
        if (submitted)
          useEditorManager
            .getState()
            .getEditor(id)
            ?.editor?.focus({ scrollIntoView: true });
      }}
    />
  );
}

export default memo(
  TitleBox,
  (prevProps, nextProps) => prevProps.readonly === nextProps.readonly
);
