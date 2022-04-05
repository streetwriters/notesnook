import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorOptions, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";

export const useTiptap = (options: Partial<EditorOptions> = {}, deps?: any) => {
  const defaultOptions = useMemo<Partial<EditorOptions>>(
    () => ({
      extensions: [
        StarterKit,
        CharacterCount,
        Placeholder.configure({
          placeholder: "Start writing your note...",
        }),
      ],
    }),
    []
  );

  const editor = useEditor({ ...defaultOptions, ...options }, deps);

  /**
   * Add editor to global for use in React Native.
   */
  global.editor = editor;
  return editor;
};
