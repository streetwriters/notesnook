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

import { useEditor } from "./use-editor";
import type { ToolbarGroupDefinition } from "@notesnook/editor/dist/toolbar/types";
import { ThemeStore } from "../../../stores/use-theme-store";
import { NoteType } from "../../../utils/types";
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
  fontSize: string;
  fontFamily: string;
};

export type EditorProps = {
  readonly: boolean;
  noToolbar: boolean;
  noHeader: boolean;
  withController: boolean;
  editorId?: string;
  onLoad?: () => void;
  onChange?: (html: string) => void;
  theme?: ThemeStore["colors"];
};

export type EditorMessage = {
  sessionId: string;
  value: unknown;
  type: string;
};

export type Note = {
  [name: string]: unknown;
  id: string | null;
  type: string;
  contentId: string;
  title: string;
  locked: boolean;
  conflicted: boolean;
  dateEdited: number;
  headline: string;
};

export type Content = {
  data?: string;
  type: string;
  noteId: string;
  id?: string;
};

export type SavePayload = {
  title?: string;
  id?: string | null;
  data?: Content["data"];
  type?: Content["type"];
  sessionId?: string | null;
  sessionHistoryId?: number;
};

export type AppState = {
  note?: NoteType;
  editing: boolean;
  movedAway: boolean;
  timestamp: number;
};
