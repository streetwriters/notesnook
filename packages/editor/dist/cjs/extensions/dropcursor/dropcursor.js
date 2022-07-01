"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropcursor = void 0;
const core_1 = require("@tiptap/core");
const dropcursor_pm_1 = require("./dropcursor.pm");
exports.Dropcursor = core_1.Extension.create({
    name: "dropCursor",
    addOptions() {
        return {
            color: "currentColor",
            width: 1,
            class: null,
        };
    },
    addProseMirrorPlugins() {
        return [(0, dropcursor_pm_1.dropCursor)(this.options)];
    },
});
