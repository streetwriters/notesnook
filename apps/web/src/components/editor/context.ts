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

import { useCallback, useEffect, useRef } from "react";
import { IEditor, NoteStatistics } from "./types";
import createStore from "../../common/store";
import BaseStore from "../../stores";
import { UseBoundStore } from "zustand";
import shallow from "zustand/shallow";
import type { ToolbarDefinition } from "@notesnook/editor";
import Config from "../../utils/config";

type EditorConfig = { fontFamily: string; fontSize: number };
type EditorSubState = {
  editor?: IEditor;
  canUndo?: boolean;
  canRedo?: boolean;
  searching?: boolean;
  toolbarConfig?: ToolbarDefinition;
  editorConfig: EditorConfig;
  statistics?: NoteStatistics;
};

class EditorContext extends BaseStore {
  subState: EditorSubState = {
    editorConfig: Config.get("editorConfig", {
      fontFamily: "sans-serif",
      fontSize: 16
    })
  };

  configure = (
    partial:
      | Partial<EditorSubState>
      | ((oldState: EditorSubState) => Partial<EditorSubState>)
  ) => {
    this.set((state: EditorContext) => {
      const newPartialState =
        typeof partial === "function" ? partial(state.subState) : partial;
      state.subState = { ...state.subState, ...newPartialState };
    });
  };
}

const [useEditorContext] = createStore(EditorContext) as [
  UseBoundStore<EditorContext>,
  EditorContext
];

export function useEditorInstance() {
  const editor = useEditorContext((store) => store.subState.editor);
  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);
  return editorRef;
}

export function useConfigureEditor() {
  return useEditorContext((store) => store.configure);
}

export const configureEditor = (
  partial:
    | Partial<EditorSubState>
    | ((oldState: EditorSubState) => Partial<EditorSubState>)
) => useEditorContext.getState().configure(partial);

export function useHistory() {
  return useEditorContext(
    (store) =>
      ({
        canUndo: store.subState.canUndo,
        canRedo: store.subState.canRedo,
        undo: store.subState.editor?.undo,
        redo: store.subState.editor?.redo
      } as const),
    shallow
  );
}

export function useSearch() {
  const isSearching = useEditorContext((store) => store.subState.searching);
  const configure = useEditorContext((store) => store.configure);
  const toggleSearch = useCallback(
    () => configure({ searching: !isSearching }),
    [isSearching, configure]
  );
  return { isSearching, toggleSearch };
}

export function useToolbarConfig() {
  const toolbarConfig = useEditorContext(
    (store) => store.subState.toolbarConfig
  );
  const configure = useEditorContext((store) => store.configure);
  const setToolbarConfig = useCallback(
    (config: ToolbarDefinition) => configure({ toolbarConfig: config }),
    [configure]
  );
  return { toolbarConfig, setToolbarConfig };
}

export function useNoteStatistics(): NoteStatistics {
  return useEditorContext(
    (store) =>
      store.subState.statistics || {
        words: { total: 0 }
      }
  );
}

export function useEditorConfig() {
  const editorConfig = useEditorContext((store) => store.subState.editorConfig);
  const configure = useEditorContext((store) => store.configure);
  const setEditorConfig = useCallback(
    (config: Partial<EditorConfig>) => {
      if (editorConfig)
        Config.set("editorConfig", {
          ...editorConfig,
          ...config
        });

      configure({
        editorConfig: {
          ...editorConfig,
          ...config
        }
      });
    },
    [editorConfig, configure]
  );

  return { editorConfig, setEditorConfig };
}
