import { Editor } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
function useForceUpdate() {
    const [, setValue] = useState(0);
    return () => setValue((value) => value + 1);
}
export const useEditor = (options = {}, deps = []) => {
    const [editor, setEditor] = useState(null);
    const forceUpdate = useForceUpdate();
    const editorRef = useRef(editor);
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
        if (editor && !editor.current)
            Object.defineProperty(editor, "current", {
                get: () => editorRef.current,
            });
    }, [editor]);
    useEffect(() => {
        // this is required for the drag/drop to work properly
        // in the editor.
        function onDragEnter(event) {
            if (!!(editor === null || editor === void 0 ? void 0 : editor.view.dragging)) {
                event.preventDefault();
                return true;
            }
        }
        editor === null || editor === void 0 ? void 0 : editor.view.dom.addEventListener("dragenter", onDragEnter);
        return () => {
            editor === null || editor === void 0 ? void 0 : editor.view.dom.removeEventListener("dragenter", onDragEnter);
        };
    }, [editor === null || editor === void 0 ? void 0 : editor.view.dom]);
    return editor;
};
