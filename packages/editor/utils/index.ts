import { Editor } from "@tiptap/react";

declare global {
  /**
   * Current tiptap instance
   */
  var editor: Editor | null;
}
