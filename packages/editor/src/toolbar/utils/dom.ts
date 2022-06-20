export function getToolbarElement() {
  return (
    (document.querySelector(".editor-toolbar") as HTMLElement) || undefined
  );
}

export function getPopupContainer() {
  return (
    (document.getElementById("popup-container") as HTMLElement) || undefined
  );
}

export function getEditorContainer() {
  return (document.querySelector(".editor") ||
    getPopupContainer()) as HTMLElement;
}

export function getEditorDOM() {
  return (document.querySelector(".ProseMirror") ||
    getEditorContainer()) as HTMLElement; // ProseMirror
}
