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
import { Editor } from "../types.js";
import { EditorState } from "@tiptap/pm/state";
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

      const oldContent = editor.options.content;
      editor.options = { ...editor.options, ...options };
      options.onBeforeCreate?.({ editor });
      // we try very hard not to create a new editor, instead
      // we just update the props & other things. This is dangerous but faster
      // than creating a new editor
      // This part below is copied from @tiptap/core
      if (options.editorProps) editor.view.setProps(options.editorProps);
      if (options.content !== undefined && options.content !== oldContent) {
        const doc = createDocument(
          options.content,
          editor.schema,
          options.parseOptions
        );
        const selection =
          editor.state.selection ||
          resolveFocusPosition(doc, options.autofocus);
        const oldIsFocused = editor.isFocused;
        editor.view.updateState(
          EditorState.create({
            doc,
            plugins: editor.extensionManager.plugins,
            selection:
              selection.from > 0 &&
              selection.from <= doc.content.size &&
              selection.to > 0 &&
              selection.to <= doc.content.size
                ? selection
                : undefined
          })
        );
        if (oldIsFocused && !editor.isFocused) editor.commands.focus();
      }
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
