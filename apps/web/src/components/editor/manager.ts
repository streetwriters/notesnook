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

import { useCallback } from "react";
import { IEditor, NoteStatistics } from "./types";
import createStore from "../../common/store";
import BaseStore from "../../stores";
import type { TOCItem, ToolbarDefinition } from "@notesnook/editor";
import Config from "../../utils/config";
import { getCurrentPreset } from "../../common/toolbar-config";

type EditorConfig = { fontFamily: string; fontSize: number };
type EditorContext = {
  editor?: IEditor;
  canUndo?: boolean;
  canRedo?: boolean;
  statistics?: NoteStatistics;
  tableOfContents?: TOCItem[];
};

class EditorManager extends BaseStore<EditorManager> {
  toolbarConfig?: ToolbarDefinition;
  editorConfig: EditorConfig = Config.get("editorConfig", {
    fontFamily: "sans-serif",
    fontSize: 16
  });
  searching?: boolean;
  editors: Record<string, EditorContext> = {};

  getEditor = (id: string): EditorContext | undefined => {
    return this.get().editors[id];
  };

  setEditor = (id: string, editor?: EditorContext) => {
    this.set((state) => {
      if (!editor) delete state.editors[id];
      else state.editors[id] = editor;
    });
  };

  updateEditor = (
    id: string,
    partial:
      | Partial<EditorContext>
      | ((oldState: EditorContext) => Partial<EditorContext>)
  ) => {
    this.set((state) => {
      const newPartialState =
        typeof partial === "function" ? partial(state.editors[id]) : partial;
      state.editors[id] = { ...state.editors[id], ...newPartialState };
    });
  };

  setEditorConfig = (config: Partial<EditorConfig>) => {
    const oldConfig = this.get().editorConfig;
    this.set({
      editorConfig: Config.set("editorConfig", {
        ...oldConfig,
        ...config
      })
    });
  };
}

const [useEditorManager] = createStore(EditorManager);

export { useEditorManager };

// export function useEditorInstance(id: string) {
//   const editor = useEditorContext((store) => store.subState.editors[id]);
//   const editorRef = useRef(editor);
//   useEffect(() => {
//     editorRef.current = editor;
//   }, [editor]);
//   return editorRef;
// }
// export const editorInstance = (id: string) =>
//   useEditorManager.getState().editors[id];

// export function useConfigureEditor() {
//   return useEditorContext((store) => store.configure);
// }

// export const configureEditor = (
//   partial:
//     | Partial<EditorSubState>
//     | ((oldState: EditorSubState) => Partial<EditorSubState>)
// ) => useEditorContext.getState().configure(partial);

export function useEditor(id: string) {
  return useEditorManager((store) => store.editors[id]);
}

export function useSearch() {
  const isSearching = useEditorManager((store) => store.searching);
  const toggleSearch = useCallback(
    () => useEditorManager.setState({ searching: !isSearching }),
    [isSearching]
  );
  return { isSearching, toggleSearch };
}

export function useToolbarConfig() {
  const toolbarConfig =
    useEditorManager((store) => store.toolbarConfig) ||
    getCurrentPreset().tools;
  const setToolbarConfig = useCallback(
    (config: ToolbarDefinition) =>
      useEditorManager.setState({ toolbarConfig: config }),
    []
  );
  return { toolbarConfig, setToolbarConfig };
}

export function useNoteStatistics(id: string): NoteStatistics {
  return useEditorManager(
    (store) =>
      store.editors[id]?.statistics || {
        words: { total: 0 }
      }
  );
}

export function useEditorConfig() {
  const editorConfig = useEditorManager((store) => store.editorConfig);
  const setEditorConfig = useEditorManager((store) => store.setEditorConfig);
  return { editorConfig, setEditorConfig };
}

export const editorConfig = () => useEditorManager.getState().editorConfig;

export const onEditorConfigChange = (
  selector: (editorConfig: EditorConfig) => any,
  listener: (
    selectedState: EditorConfig,
    previousSelectedState: EditorConfig
  ) => void
) => useEditorManager.subscribe((s) => selector(s.editorConfig), listener);
