"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditor = void 0;
const react_1 = require("react");
const types_1 = require("../types");
function useForceUpdate() {
    const [, setValue] = (0, react_1.useState)(0);
    return () => setValue((value) => value + 1);
}
const useEditor = (options = {}, deps = []) => {
    const [editor, setEditor] = (0, react_1.useState)(null);
    const forceUpdate = useForceUpdate();
    const editorRef = (0, react_1.useRef)(editor);
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        const instance = new types_1.Editor(options);
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
    (0, react_1.useEffect)(() => {
        editorRef.current = editor;
        if (!editor)
            return;
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
    (0, react_1.useEffect)(() => {
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
exports.useEditor = useEditor;
