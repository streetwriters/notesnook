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
