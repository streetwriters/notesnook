"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEditorDOM = exports.getEditorContainer = exports.getPopupContainer = exports.getToolbarElement = void 0;
function getToolbarElement() {
    return (document.querySelector(".editor-toolbar") || undefined);
}
exports.getToolbarElement = getToolbarElement;
function getPopupContainer() {
    return (document.getElementById("popup-container") || undefined);
}
exports.getPopupContainer = getPopupContainer;
function getEditorContainer() {
    return (document.querySelector(".editor") ||
        getPopupContainer());
}
exports.getEditorContainer = getEditorContainer;
function getEditorDOM() {
    return (document.querySelector(".ProseMirror") ||
        getEditorContainer()); // ProseMirror
}
exports.getEditorDOM = getEditorDOM;
