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

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Input } from "@theme-ui/components";
import { useStore, store } from "../../stores/editor-store";
import { debounceWithId } from "@notesnook/common";
import useMobile from "../../hooks/use-mobile";
import useTablet from "../../hooks/use-tablet";
import { useEditorConfig } from "./context";
import { getFontById } from "@notesnook/editor";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { replaceDateTime } from "@notesnook/editor/dist/extensions/date-time";
import { useStore as useSettingsStore } from "../../stores/setting-store";

type TitleBoxProps = {
  readonly: boolean;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useStore((store) => store.session.id);
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
    (length) => {
      if (!inputRef.current) return;
      const fontSize = textLengthToFontSize(
        length,
        isMobile || isTablet ? 1.625 : 2.625
      );
      inputRef.current.style.fontSize = `${fontSize}em`;
    },
    [isMobile, isTablet]
  );

  useEffect(() => {
    if (!inputRef.current) return;
    const { title } = useStore.getState().session;
    inputRef.current.value = title;
    updateFontSize(title.length);
  }, [id, updateFontSize]);

  useEffect(() => {
    if (!inputRef.current) return;
    updateFontSize(inputRef.current.value.length);
  }, [isTablet, isMobile, updateFontSize]);

  useEffect(() => {
    const { unsubscribe } = AppEventManager.subscribe(
      AppEvents.changeNoteTitle,
      ({ preventSave, title }: { title: string; preventSave: boolean }) => {
        if (!inputRef.current) return;
        withSelectionPersist(
          inputRef.current,
          (input) => (input.value = title)
        );
        updateFontSize(title.length);
        if (!preventSave) {
          const { sessionId, id } = store.get().session;
          debouncedOnTitleChange(sessionId, id, title);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      variant="clean"
      id="editor-title"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={"Note title"}
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
      onChange={(e) => {
        const { sessionId, id } = store.get().session;
        e.target.value = replaceDateTime(
          e.target.value,
          dateFormat,
          timeFormat
        );
        debouncedOnTitleChange(sessionId, id, e.target.value);
        updateFontSize(e.target.value.length);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return prevProps.readonly === nextProps.readonly;
});

function onTitleChange(noteId: string | undefined, title: string) {
  store.get().setTitle(noteId, title);
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
