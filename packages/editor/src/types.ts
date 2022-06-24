import { Editor as TiptapEditor } from "@tiptap/core";
export interface Editor extends TiptapEditor {
  /**
   * Use this to get the latest instance of the editor.
   * This is required to reduce unnecessary rerenders of
   * toolbar elements.
   */
  current?: TiptapEditor;
}
