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
import { DependencyList, useEffect, useRef, useState } from "react";
import { Editor } from "../types";

function useForceUpdate() {
  const [, setValue] = useState(0);

  return () => setValue((value) => value + 1);
}

export const useEditor = (
  options: Partial<EditorOptions> = {},
  deps: DependencyList = []
) => {
  const [editor] = useState<Editor>(() => {
    const instance = new Editor(options);
    if (instance && !Object.hasOwn(instance, "current")) {
      Object.defineProperty(instance, "current", {
        get: () => editorRef.current
      });
    }
    return instance;
  });
  const forceUpdate = useForceUpdate();
  const editorRef = useRef<TiptapEditor>(editor);

  useEffect(
    () => {
      let isMounted = true;
      let updateTimeout: number;
      editor.setOptions(options);
      editor.on("transaction", ({ editor }) => {
        editorRef.current = editor;
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(() => {
          if (isMounted) {
            forceUpdate();
          }
        }, 200) as unknown as number;
      });

      return () => {
        isMounted = false;

        clearTimeout(updateTimeout);
        editor.destroy();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    // this is required for the drag/drop to work properly
    // in the editor.
    function onDragEnter(event: DragEvent) {
      if (editor.view.dragging) {
        event.preventDefault();
        return true;
      }
    }

    editor.view.dom.addEventListener("dragenter", onDragEnter);
    return () => {
      editor.view.dom.removeEventListener("dragenter", onDragEnter);
    };
  }, [editor.view.dom, editor.view.dragging]);

  return editor;
};
