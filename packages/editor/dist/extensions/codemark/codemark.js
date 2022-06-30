import { Extension } from "@tiptap/core";
import codemark from "prosemirror-codemark";
// import "prosemirror-codemark/dist/codemark.css";
export var Codemark = Extension.create({
    name: "codemarkPlugin",
    addProseMirrorPlugins: function () {
        return codemark({ markType: this.editor.schema.marks.code });
    },
});
