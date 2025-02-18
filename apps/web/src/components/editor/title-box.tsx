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

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Textarea } from "@theme-ui/components";
import { useEditorStore } from "../../stores/editor-store";
import { debounceWithId } from "@notesnook/common";
import { useEditorConfig, useEditorManager } from "./manager";
import { getFontById } from "@notesnook/editor";
import { replaceDateTime } from "@notesnook/editor";
import { useStore as useSettingsStore } from "../../stores/setting-store";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { strings } from "@notesnook/intl";

type TitleBoxProps = {
  id: string;
  readonly: boolean;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly, id } = props;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pendingChanges = useRef(false);
  // const id = useStore((store) => store.session.id);
  const sessionType = useEditorStore((store) => store.getSession(id)?.type);
  const { editorConfig } = useEditorConfig();
  const dateFormat = useSettingsStore((store) => store.dateFormat);
  const timeFormat = useSettingsStore((store) => store.timeFormat);

  const fontFamily = useMemo(
    () => getFontById(editorConfig.fontFamily)?.font || "heading",
    [editorConfig.fontFamily]
  );

  useLayoutEffect(() => {
    const session = useEditorStore.getState().getSession(id);
    if (!session || !("note" in session) || !session.note || !inputRef.current)
      return;
    if (pendingChanges.current) return;

    const { title } = session.note;
    if (inputRef.current.value === title) return;

    withSelectionPersist(
      inputRef.current,
      (input) => (input.value = title || "")
    );
  }, [sessionType, id]);

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
        if (!inputRef.current || sessionId !== id) return;
        withSelectionPersist(
          inputRef.current,
          (input) => (input.value = title)
        );
        if (!preventSave) {
          pendingChanges.current = true;
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
      ref={inputRef}
      variant="clean"
      id="editor-title"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={strings.noteTitle()}
      readOnly={readonly}
      dir="auto"
      wrap="soft"
      rows={1}
      sx={{
        p: 0,
        fontFamily,
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading",
        width: "100%",
        fieldSizing: "content",
        whiteSpace: "pre-wrap",
        resize: "none",
        overflow: "hidden",
        "::placeholder": {
          color: "placeholder"
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const context = useEditorManager.getState().getEditor(id);
          if (!context) return;
          context.editor?.focus({ scrollIntoView: true });
        }
      }}
      onChange={(e) => {
        pendingChanges.current = true;
        e.target.value = replaceDateTime(
          e.target.value,
          dateFormat,
          timeFormat
        );
        debouncedOnTitleChange(id, id, e.target.value, pendingChanges);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return prevProps.readonly === nextProps.readonly;
});

function onTitleChange(
  noteId: string,
  title: string,
  pendingChanges: React.MutableRefObject<boolean>
) {
  useEditorStore.getState().setTitle(noteId, title);
  pendingChanges.current = false;
}

const debouncedOnTitleChange = debounceWithId(onTitleChange, 100);

function withSelectionPersist(
  input: HTMLTextAreaElement,
  action: (input: HTMLTextAreaElement) => void
) {
  const selection = {
    start: input.selectionStart,
    end: input.selectionEnd,
    direction: input.selectionDirection
  };
  action(input);
  input.setSelectionRange(
    selection.start,
    selection.end,
    selection.direction || undefined
  );
}
