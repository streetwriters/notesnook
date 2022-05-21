import { useEditor } from './use-editor';

export type useEditorType = ReturnType<typeof useEditor>;

export type EditorState = {
  currentlyEditing: boolean;
  isFullscreen: boolean;
  onNoteCreated?: ((id: string) => void) | null;
  isFocused: boolean;
  focusType: 'title' | 'editor' | null;
  movedAway: boolean;
  tooltip: boolean;
  isRestoringState: boolean;
  keyboardState: boolean;
  ready: boolean;
  saveCount: 0;
};

export type EditorMessage = {
  sessionId: string;
  value: any;
  type: string;
};

export type Note = {
  [name: string]: any;
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
  data?: Content['data'];
  type?: Content['type'];
  sessionId?: string | null;
  sessionHistoryId?: number;
};

export type AppState = {
  note?: Note;
  editing: boolean;
  movedAway: boolean;
  timestamp: number;
};
