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

import type { EditorHandle, EditorHeading, EditorStatistics } from "@ui";
import createStore from "../../common/store";
import BaseStore from "../../stores";
import Config from "../../utils/config";

type EditorConfig = {
  fontFamily: string;
  fontSize: number;
  zoom: number;
  lineHeight: number;
};

export type NoteStatistics = EditorStatistics;
export type IEditor = EditorHandle;
export type TOCItem = EditorHeading;

type EditorContext = {
  editor?: IEditor;
  canUndo?: boolean;
  canRedo?: boolean;
  statistics?: NoteStatistics;
  tableOfContents?: TOCItem[];
};

const EDITOR_ZOOM_DEFAULT = 100;
const EDITOR_LINE_HEIGHT_DEFAULT = 1.2;

class EditorManager extends BaseStore<EditorManager> {
  activeEditorId?: string;
  editorConfig: EditorConfig = Config.get("editorConfig", {
    fontFamily: "sans-serif",
    fontSize: 14,
    zoom: EDITOR_ZOOM_DEFAULT,
    lineHeight: EDITOR_LINE_HEIGHT_DEFAULT
  });
  editors: Record<string, EditorContext | undefined> = {};

  getEditor = (id: string): EditorContext | undefined => {
    return this.get().editors[id];
  };

  setEditor = (id: string, editor?: EditorContext) => {
    this.set((state) => {
      if (!editor) delete state.editors[id];
      else state.editors[id] = editor;
      state.activeEditorId = editor
        ? id
        : id === state.activeEditorId
        ? undefined
        : state.activeEditorId;
    });
  };

  updateEditor = (
    id: string,
    partial:
      | Partial<EditorContext>
      | ((oldState: EditorContext) => Partial<EditorContext>)
  ) => {
    this.set((state) => {
      const oldState = state.editors[id];
      if (!oldState) return;
      state.activeEditorId = id;
      const newPartialState =
        typeof partial === "function" ? partial(oldState) : partial;
      state.editors[id] = { ...oldState, ...newPartialState };
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

const [useEditorManager] = createStore<EditorManager>(
  (set, get) => new EditorManager(set, get)
);

export { useEditorManager };

export function useEditor(id: string) {
  return useEditorManager((store) => store.editors[id]);
}

export function useNoteStatistics(): NoteStatistics {
  return useEditorManager(
    (store) =>
      (store.activeEditorId &&
        store.editors[store.activeEditorId]?.statistics) || {
        words: { total: 0 },
        characters: { total: 0 },
        paragraphs: { total: 0 },
        spaces: { total: 0 }
      }
  );
}

export function useEditorConfig() {
  const editorConfig = useEditorManager((store) => store.editorConfig);
  const setEditorConfig = useEditorManager((store) => store.setEditorConfig);
  return { editorConfig, setEditorConfig };
}

export const editorConfig = () => useEditorManager.getState().editorConfig;

export const onEditorConfigChange = <T>(
  selector: (editorConfig: EditorConfig) => T,
  listener: (selectedState: T, previousSelectedState: T) => void
) => useEditorManager.subscribe((s) => selector(s.editorConfig), listener);
