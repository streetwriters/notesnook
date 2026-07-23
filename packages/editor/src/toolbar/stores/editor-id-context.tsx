/*
ABOUTME: Provides React Context for scoping toolbar popup state per-editor instance.
ABOUTME: Used by usePopupManager to prefix popup IDs with the editor's unique ID.
*/

import { createContext, useContext, type PropsWithChildren } from "react";

const EditorIdContext = createContext<string | undefined>(undefined);

export function EditorIdProvider({
  editorId,
  children
}: PropsWithChildren<{ editorId: string }>) {
  return (
    <EditorIdContext.Provider value={editorId}>
      {children}
    </EditorIdContext.Provider>
  );
}

export function useEditorId(): string | undefined {
  return useContext(EditorIdContext);
}
