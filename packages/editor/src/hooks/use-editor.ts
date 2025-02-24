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

import { EditorOptions, Editor as TiptapEditor } from "@tiptap/core";
import { DependencyList, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "../types.js";
import { useToolbarStore } from "../toolbar/stores/toolbar-store.js";

function useForceUpdate() {
  const [, setValue] = useState(0);

  return () => setValue((value) => value + 1);
}

export const useEditor = (
  options: Partial<EditorOptions> = {},
  deps: DependencyList = []
) => {
  const editor = useMemo<Editor>(() => new Editor(options), []);
  const forceUpdate = useForceUpdate();
  const editorRef = useRef<TiptapEditor>(editor);

  useEffect(
    () => {
      if (editor.view.isDestroyed) return;

      let isMounted = true;
      let updateTimeout: number;

      editor.options = { ...editor.options, ...options };
      options.onBeforeCreate?.({ editor });
      const oldIsFocused = editor.isFocused;
      editor.view.destroy();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore instead of creating a new editor, we just create
      // a new view. Due to some reason this is faster than resetting
      // the state of the same view.
      editor.createView();
      if (oldIsFocused && !editor.isFocused) editor.commands.focus();
      options.onCreate?.({ editor: editor });

      function onTransaction({ editor }: { editor: TiptapEditor }) {
        editorRef.current = editor;
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          if (isMounted) {
            forceUpdate();
          }
        }, 200) as unknown as number;
      }
      editor.on("transaction", onTransaction);

      return () => {
        isMounted = false;
        editor.off("transaction", onTransaction);
        clearTimeout(updateTimeout);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    return () => {
      editor.view.destroy();
      editor.destroy();
    };
  }, [editor]);

  useEffect(() => {
    // this is required for the drag/drop to work properly
    // in the editor.
    function onDragEnter(event: DragEvent) {
      if (editor.view.dragging) {
        event.preventDefault();
        return true;
      }
    }

    function onClick() {
      useToolbarStore.getState().closeAllPopups();
    }

    editor.view.dom.addEventListener("dragenter", onDragEnter);
    editor.view.dom.addEventListener("click", onClick);
    return () => {
      editor.view.dom.removeEventListener("dragenter", onDragEnter);
      editor.view.dom.removeEventListener("click", onClick);
    };
  }, [editor.view.dom, editor.view.dragging]);

  return editor;
};
