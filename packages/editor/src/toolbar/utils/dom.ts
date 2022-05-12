export function getToolbarElement() {
  return (
    (document.querySelector(".editor-toolbar") as HTMLElement) || undefined
  );
}
