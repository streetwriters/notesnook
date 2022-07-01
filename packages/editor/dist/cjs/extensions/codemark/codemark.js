"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codemark = void 0;
const core_1 = require("@tiptap/core");
const prosemirror_codemark_1 = __importDefault(require("prosemirror-codemark"));
exports.Codemark = core_1.Extension.create({
    name: "codemarkPlugin",
    addProseMirrorPlugins() {
        return (0, prosemirror_codemark_1.default)({ markType: this.editor.schema.marks.code });
    },
});
