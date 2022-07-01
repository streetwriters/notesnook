"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEditor = void 0;
const core_1 = require("@tiptap/core");
const react_1 = require("react");
function useForceUpdate() {
    const [, setValue] = (0, react_1.useState)(0);
    return () => setValue((value) => value + 1);
}
const useEditor = (options = {}, deps = []) => {
    const [editor, setEditor] = (0, react_1.useState)(null);
    const forceUpdate = useForceUpdate();
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        const instance = new core_1.Editor(options);
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
    return editor;
};
exports.useEditor = useEditor;
