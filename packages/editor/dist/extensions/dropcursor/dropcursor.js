import { Extension } from "@tiptap/core";
import { dropCursor } from "./drop-cursor.pm";
export var Dropcursor = Extension.create({
    name: "dropCursor",
    addOptions: function () {
        return {
            color: "currentColor",
            width: 1,
            class: null,
        };
    },
    addProseMirrorPlugins: function () {
        return [dropCursor(this.options)];
    },
});
