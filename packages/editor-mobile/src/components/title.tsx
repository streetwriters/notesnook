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

import { getFontById, replaceDateTime } from "@notesnook/editor";
import React, { RefObject, useCallback, useEffect, useRef } from "react";
import { EditorController } from "../hooks/useEditorController";
import { useTabContext } from "../hooks/useTabStore";
import styles from "./styles.module.css";
function Title({
  controller,
  title,
  titlePlaceholder,
  readonly,
  fontFamily,
  dateFormat,
  timeFormat,
  loading
}: {
  controller: RefObject<EditorController>;
  title: string;
  titlePlaceholder: string;
  readonly: boolean;
  fontFamily: string;
  dateFormat: string;
  timeFormat: string;
  loading?: boolean;
}) {
  const tab = useTabContext();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const titleSizeDiv = useRef<HTMLDivElement>(null);

  const resizeTextarea = useCallback(() => {
    if (!titleSizeDiv.current || !titleRef.current) return;
    titleSizeDiv.current.innerText = titleRef.current.value;
    titleRef.current.style.height = `${titleSizeDiv.current.clientHeight}px`;
    titleSizeDiv.current.style.width = `${titleRef.current.clientWidth}px`;
  }, []);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.value = title;
      resizeTextarea();
    }

    window.addEventListener("resize", resizeTextarea);
    return () => {
      window.removeEventListener("resize", resizeTextarea);
    };
  }, [resizeTextarea, title]);

  useEffect(() => {
    globalThis.editorTitles[tab.id] = titleRef;
    return () => {
      globalThis.editorTitles[tab.id] = undefined;
    };
  }, [tab.id, titleRef]);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        resizeTextarea();
      }, 300);
    }
  }, [loading, resizeTextarea]);

  return loading ? null : (
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
        defaultValue={title}
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
        onInput={(event) => {
          resizeTextarea();
          (event.target as HTMLTextAreaElement).value = replaceDateTime(
            (event.target as HTMLTextAreaElement).value,
            dateFormat,
            timeFormat as "12-hour" | "24-hour"
          );
          controller.current?.titleChange(
            (event.target as HTMLTextAreaElement).value
          );
        }}
        onKeyDown={(e) => {
          const editor = editors[tab.id];
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            editor?.commands.focus();
          }
        }}
        onPaste={() => {
          resizeTextarea();
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
    prev.fontFamily !== next.fontFamily ||
    prev.loading !== next.loading
  )
    return false;

  return true;
});
