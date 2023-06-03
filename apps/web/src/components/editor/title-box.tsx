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
import { debounceWithId } from "../../utils/debounce";
import useMobile from "../../hooks/use-mobile";
import useTablet from "../../hooks/use-tablet";
import { useEditorConfig } from "./context";
import { getFontById } from "@notesnook/editor";

type TitleBoxProps = {
  readonly: boolean;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const title = useStore((store) => store.session.title);
  const id = useStore((store) => store.session.id);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const { editorConfig } = useEditorConfig();

  const MAX_FONT_SIZE = useMemo(() => {
    return isMobile || isTablet ? 1.625 : 2.625;
  }, [isMobile, isTablet]);

  const updateFontSize = useCallback(
    (length) => {
      if (!inputRef.current) return;
      const fontSize = textLengthToFontSize(length, MAX_FONT_SIZE);
      inputRef.current.style.fontSize = `${fontSize}em`;
    },
    [MAX_FONT_SIZE]
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.placeholder = "Note title";
      inputRef.current.value = title;
      updateFontSize(title.length);
    }
  }, [id, updateFontSize]);

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== title) {
      inputRef.current.placeholder = title || "Note title";
    }
  }, [title]);

  return (
    <Input
      ref={inputRef}
      variant="clean"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={"Note title"}
      readOnly={readonly}
      sx={{
        p: 0,
        fontFamily: getFontById(editorConfig.fontFamily)?.font || "heading",
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading",
        width: "100%"
      }}
      onChange={(e) => {
        const { sessionId, id } = store.get().session;
        debouncedOnTitleChange(sessionId, id, e.target.value);
        updateFontSize(e.target.value.length);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return prevProps.readonly === nextProps.readonly;
});

function onTitleChange(noteId: string, title: string) {
  store.get().setTitle(noteId, title);
}

const debouncedOnTitleChange = debounceWithId(onTitleChange, 100);

function textLengthToFontSize(length: number, max: number) {
  const stepLength = 35;
  const decreaseStep = 0.5;
  const steps = length / stepLength;
  return Math.max(1.2, Math.min(max, max - steps * decreaseStep));
}
