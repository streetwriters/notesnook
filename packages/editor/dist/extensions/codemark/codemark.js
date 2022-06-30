"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codemark = void 0;
var core_1 = require("@tiptap/core");
var prosemirror_codemark_1 = __importDefault(require("prosemirror-codemark"));
exports.Codemark = core_1.Extension.create({
    name: "codemarkPlugin",
    addProseMirrorPlugins: function () {
        return (0, prosemirror_codemark_1.default)({ markType: this.editor.schema.marks.code });
    },
});
