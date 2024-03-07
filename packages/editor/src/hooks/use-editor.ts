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

import {
  EditorOptions,
  Editor as TiptapEditor,
  createDocument,
  resolveFocusPosition
} from "@tiptap/core";
import { DependencyList, useEffect, useMemo, useRef, useState } from "react";
import { Editor } from "../types";
import { EditorState } from "@tiptap/pm/state";

function useForceUpdate() {
  const [, setValue] = useState(0);

  return () => setValue((value) => value + 1);
}

export const useEditor = (
  options: Partial<EditorOptions> = {},
  deps: DependencyList = []
) => {
  const editor = useMemo<Editor>(() => {
    const instance = new Editor(options);
    if (instance && typeof instance.current === "undefined") {
      Object.defineProperty(instance, "current", {
        get: () => editorRef.current
      });
    }
    return instance;
  }, []);
  const forceUpdate = useForceUpdate();
  const editorRef = useRef<TiptapEditor>(editor);

  useEffect(
    () => {
      let isMounted = true;
      let updateTimeout: number;

      // we try very hard not to create a new editor, instead
      // we just update the props & other things. This is dangerous but faster
      // than creating a new editor
      // This part below is copied from @tiptap/core
      if (options.editorProps) editor.view.setProps(options.editorProps);
      if (
        options.content !== undefined &&
        options.content !== editor.options.content
      ) {
        const doc = createDocument(
          options.content,
          editor.schema,
          options.parseOptions
        );
        const selection = resolveFocusPosition(doc, options.autofocus);
        editor.view.updateState(
          EditorState.create({
            doc,
            plugins: editor.extensionManager.plugins,
            selection: selection || undefined
          })
        );
      }
      editor.options = { ...editor.options, ...options };

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
  }, []);

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
