export function getToolbarElement() {
    return (document.querySelector(".editor-toolbar") || undefined);
}
export function getPopupContainer() {
    return (document.getElementById("popup-container") || undefined);
}
export function getEditorContainer() {
    return (document.querySelector(".editor") ||
        getPopupContainer());
}
export function getEditorDOM() {
    return (document.querySelector(".ProseMirror") ||
        getEditorContainer()); // ProseMirror
}
