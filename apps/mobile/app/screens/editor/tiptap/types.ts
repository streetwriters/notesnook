import { useEditor } from "./use-editor";
import type { ToolbarGroupDefinition } from "@streetwriters/editor/dist/toolbar/types";
import { ThemeStore } from "../../../stores/use-theme-store";
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
  note?: Note;
  editing: boolean;
  movedAway: boolean;
  timestamp: number;
};
