import { EditorOptions } from "@tiptap/core";
import { DependencyList, useEffect, useRef, useState } from "react";
import { Editor } from "../types";

function useForceUpdate() {
  const [, setValue] = useState(0);

  return () => setValue((value) => value + 1);
}

export const useEditor = (
  options: Partial<EditorOptions> = {},
  deps: DependencyList = []
) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const forceUpdate = useForceUpdate();
  const editorRef = useRef<Editor | null>(editor);

  useEffect(() => {
    let isMounted = true;

    const instance = new Editor(options);

    setEditor(instance);

    instance.on("transaction", () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (isMounted) {
            forceUpdate();
          }
        });
      });
    });

    return () => {
      instance.destroy();
      isMounted = false;
    };
  }, deps);

  useEffect(() => {
    editorRef.current = editor;

    if (!editor) return;

    if (!editor.current) {
      Object.defineProperty(editor, "current", {
        get: () => editorRef.current,
      });
    }
    // if (!editor.executor) {
    //   Object.defineProperty(editor, "executor", {
    //     get: () => (id?: string) => {
    //       console.log(id);
    //       return editorRef.current;
    //     },
    //   });
    // }
  }, [editor]);

  useEffect(() => {
    // this is required for the drag/drop to work properly
    // in the editor.
    function onDragEnter(event: DragEvent) {
      if (!!editor?.view.dragging) {
        event.preventDefault();
        return true;
      }
    }

    editor?.view.dom.addEventListener("dragenter", onDragEnter);
    return () => {
      editor?.view.dom.removeEventListener("dragenter", onDragEnter);
    };
  }, [editor?.view.dom]);

  return editor;
};
