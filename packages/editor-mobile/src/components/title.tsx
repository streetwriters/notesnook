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

import React from "react";
import { RefObject, useEffect, useRef } from "react";
import { EditorController } from "../hooks/useEditorController";
import styles from "./styles.module.css";
function Title({
  controller,
  title,
  titlePlaceholder,
  readonly
}: {
  controller: RefObject<EditorController>;
  title: string;
  titlePlaceholder: string;
  readonly: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const emitUpdate = useRef(true);
  global.editorTitle = titleRef;

  useEffect(() => {
    if (titleRef.current) {
      emitUpdate.current = false;
      titleRef.current.value = title;
      emitUpdate.current = true;
    }
  }, [title]);

  return (
    <input
      ref={titleRef}
      className={styles.titleBar}
      contentEditable={!readonly}
      disabled={readonly}
      style={{
        height: 50,
        fontSize: 25,
        width: "100%",
        boxSizing: "border-box",
        borderWidth: 0,
        paddingRight: 12,
        paddingLeft: 12,
        fontWeight: 600,
        fontFamily: "Open Sans",
        backgroundColor: "transparent",
        color: "var(--nn_heading)",
        caretColor: "var(--nn_accent)"
      }}
      maxLength={150}
      onChange={(event) => {
        if (!emitUpdate.current) return;
        controller.current?.titleChange(event.target.value);
      }}
      placeholder={titlePlaceholder}
    />
  );
}

export default React.memo(Title, (prev, next) => {
  if (prev.title !== next.title) return false;
  if (prev.titlePlaceholder !== next.titlePlaceholder) return false;
  if (prev.readonly !== next.readonly) return false;
  return true;
});
