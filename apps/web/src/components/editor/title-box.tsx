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

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Input } from "@theme-ui/components";
import { useEditorStore } from "../../stores/editor-store";
import { debounceWithId } from "@notesnook/common";
import useMobile from "../../hooks/use-mobile";
import useTablet from "../../hooks/use-tablet";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingChanges = useRef(false);
  // const id = useStore((store) => store.session.id);
  const sessionType = useEditorStore((store) => store.getSession(id)?.type);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const { editorConfig } = useEditorConfig();
  const dateFormat = useSettingsStore((store) => store.dateFormat);
  const timeFormat = useSettingsStore((store) => store.timeFormat);

  const fontFamily = useMemo(
    () => getFontById(editorConfig.fontFamily)?.font || "heading",
    [editorConfig.fontFamily]
  );

  const updateFontSize = useCallback(
    (length: number) => {
      if (!inputRef.current) return;
      const fontSize = textLengthToFontSize(
        length,
        isMobile || isTablet ? 1.625 : 2.625
      );
      inputRef.current.style.fontSize = `${fontSize}em`;
    },
    [isMobile, isTablet]
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
    updateFontSize(title?.length || 0);
  }, [sessionType, id, updateFontSize]);

  useEffect(() => {
    if (!inputRef.current) return;
    updateFontSize(inputRef.current.value.length);
  }, [isTablet, isMobile, updateFontSize]);

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
        updateFontSize(title.length);
        if (!preventSave) {
          pendingChanges.current = true;
          debouncedOnTitleChange(sessionId, sessionId, title, pendingChanges);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [updateFontSize, id]);

  return (
    <Input
      ref={inputRef}
      variant="clean"
      id="editor-title"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={strings.noteTitle()}
      readOnly={readonly}
      dir="auto"
      sx={{
        p: 0,
        fontFamily,
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading",
        width: "100%",
        "::placeholder": {
          color: "placeholder"
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
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
        updateFontSize(e.target.value.length);
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

function textLengthToFontSize(length: number, max: number) {
  const stepLength = 35;
  const decreaseStep = 0.5;
  const steps = length / stepLength;
  return Math.max(1.2, Math.min(max, max - steps * decreaseStep));
}

function withSelectionPersist(
  input: HTMLInputElement,
  action: (input: HTMLInputElement) => void
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
