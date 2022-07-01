import { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";
function useForceUpdate() {
    const [, setValue] = useState(0);
    return () => setValue((value) => value + 1);
}
export const useEditor = (options = {}, deps = []) => {
    const [editor, setEditor] = useState(null);
    const forceUpdate = useForceUpdate();
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
    return editor;
};
