import { Extension } from "@tiptap/core";
import { dropCursor } from "./drop-cursor.pm";
export const Dropcursor = Extension.create({
    name: "dropCursor",
    addOptions() {
        return {
            color: "currentColor",
            width: 1,
            class: null,
        };
    },
    addProseMirrorPlugins() {
        return [dropCursor(this.options)];
    },
});
