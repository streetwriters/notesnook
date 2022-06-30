"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dropcursor = void 0;
var core_1 = require("@tiptap/core");
var dropcursor_pm_1 = require("./dropcursor.pm");
exports.Dropcursor = core_1.Extension.create({
    name: "dropCursor",
    addOptions: function () {
        return {
            color: "currentColor",
            width: 1,
            class: null,
        };
    },
    addProseMirrorPlugins: function () {
        return [(0, dropcursor_pm_1.dropCursor)(this.options)];
    },
});
