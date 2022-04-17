import { Editor } from "@tiptap/react";

declare global {
  /**
   * Current tiptap instance registered with global for use in React Native
   */
  var editor: Editor | null;
}
