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

import type { ToolbarGroupDefinition } from "@notesnook/editor";
import { useEditor } from "./use-editor";
export type useEditorType = ReturnType<typeof useEditor>;

export type EditorState = {
  currentlyEditing: boolean;
  isFullscreen: boolean;
  onNoteCreated?: ((id: string) => void) | null;
  isFocused: boolean;
  focusType: "title" | "editor" | null;
  movedAway: boolean;
  tooltip: boolean;
  isRestoringState: boolean;
  keyboardState: boolean;
  ready: boolean;
  saveCount: 0;
  isAwaitingResult: boolean;
  scrollPosition: number;
  overlay?: boolean;
  initialLoadCalled?: boolean;
  editorStateRestored?: boolean;
};

export type Settings = {
  readonly: boolean;
  fullscreen: boolean;
  deviceMode: string;
  premium: boolean;
  tools: ToolbarGroupDefinition[];
  noToolbar?: boolean;
  noHeader?: boolean;
  keyboardShown?: boolean;
  doubleSpacedLines?: boolean;
  corsProxy: string;
  fontSize: number;
  fontFamily: string;
  dateFormat: string;
  timeFormat: string;
  fontScale: number;
  markdownShortcuts: boolean;
};

export type EditorProps = {
  readonly?: boolean;
  noToolbar?: boolean;
  noHeader?: boolean;
  withController?: boolean;
  editorId?: string;
  onLoad?: () => void;
  onChange?: (html: string) => void;
};

export type EditorMessage<T> = {
  sessionId: string;
  value: T;
  type: string;
  noteId: string;
  tabId: string;
  resolverId?: string;
  hasTimeout?: boolean;
};

export type SavePayload = {
  title?: string;
  id?: string;
  data?: string;
  type?: "tiptap";
  sessionHistoryId?: number;
  ignoreEdit: boolean;
  tabId: string;
  pendingChanges?: boolean;
};

export type AppState = {
  editing: boolean;
  movedAway: boolean;
  timestamp: number;
  noteId?: string;
};
