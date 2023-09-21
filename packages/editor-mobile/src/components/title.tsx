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

import { getFontById } from "@notesnook/editor";
import React, { RefObject, useCallback, useEffect, useRef } from "react";
import { EditorController } from "../hooks/useEditorController";
import styles from "./styles.module.css";
function Title({
  controller,
  title,
  titlePlaceholder,
  readonly,
  fontFamily
}: {
  controller: RefObject<EditorController>;
  title: string;
  titlePlaceholder: string;
  readonly: boolean;
  fontFamily: string;
}) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titleSizeDiv = useRef<HTMLDivElement>(null);
  const emitUpdate = useRef(true);
  global.editorTitle = titleRef;

  const resizeTextarea = useCallback(() => {
    if (!titleSizeDiv.current || !titleRef.current) return;
    titleSizeDiv.current.innerText = titleRef.current.value;
    titleRef.current.style.height = `${titleSizeDiv.current.clientHeight}px`;
    titleSizeDiv.current.style.width = `${titleRef.current.clientWidth}px`;
  }, []);

  useEffect(() => {
    if (titleRef.current) {
      emitUpdate.current = false;
      titleRef.current.value = title;
      resizeTextarea();
      emitUpdate.current = true;
    }

    window.addEventListener("resize", resizeTextarea);
    return () => {
      window.removeEventListener("resize", resizeTextarea);
    };
  }, [resizeTextarea, title]);

  return (
    <>
      <div
        ref={titleSizeDiv}
        style={{
          width: "100%",
          maxWidth: "100%",
          minHeight: 40,
          opacity: 0,
          paddingRight: 10,
          paddingLeft: 10,
          fontWeight: 600,
          fontFamily: getFontById(fontFamily)?.font || "Open Sans",
          boxSizing: "border-box",
          fontSize: 25,
          zIndex: -1,
          position: "absolute",
          userSelect: "none",
          WebkitUserSelect: "none",
          pointerEvents: "none",
          overflowWrap: "anywhere",
          paddingTop: 3,
          whiteSpace: "break-spaces"
        }}
      />
      <textarea
        ref={titleRef}
        className={styles.titleBar}
        rows={1}
        contentEditable={!readonly}
        disabled={readonly}
        style={{
          height: 40,
          minHeight: 40,
          fontSize: 25,
          width: "100%",
          boxSizing: "border-box",
          border: 0,
          opacity: 1,
          paddingRight: 10,
          paddingLeft: 10,
          fontWeight: 600,
          fontFamily: getFontById(fontFamily)?.font || "Open Sans",
          backgroundColor: "transparent",
          color: "var(--nn_primary_heading)",
          caretColor: "var(--nn_primary_accent)",
          borderRadius: 0,
          overflow: "hidden",
          overflowX: "hidden",
          overflowY: "hidden"
        }}
        maxLength={1000}
        onInput={() => {
          resizeTextarea();
        }}
        onPaste={() => {
          resizeTextarea();
        }}
        onChange={(event) => {
          resizeTextarea();
          if (!emitUpdate.current) return;
          controller.current?.titleChange(event.target.value);
        }}
        placeholder={titlePlaceholder}
      />
    </>
  );
}

export default React.memo(Title, (prev, next) => {
  if (
    prev.title !== next.title ||
    prev.titlePlaceholder !== next.titlePlaceholder ||
    prev.readonly !== next.readonly ||
    prev.fontFamily !== next.fontFamily
  )
    return false;

  return true;
});
