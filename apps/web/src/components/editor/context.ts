import { useCallback, useEffect, useRef } from "react";
import { IEditor, NoteStatistics } from "./types";
import createStore from "../../common/store";
import BaseStore from "../../stores";
import { UseBoundStore } from "zustand";
import shallow from "zustand/shallow";
import type { ToolbarDefinition } from "@streetwriters/editor";

type EditorSubState = {
  editor?: IEditor;
  canUndo?: boolean;
  canRedo?: boolean;
  searching?: boolean;
  toolbarConfig?: ToolbarDefinition;
  statistics?: NoteStatistics;
};
class EditorContext extends BaseStore {
  subState: EditorSubState = {};

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
