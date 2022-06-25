import { HoverPopupHandler } from "./hover-popup";
import { SearchReplaceFloatingMenu } from "./search-replace";
import { FloatingMenuProps } from "./types";

export function EditorFloatingMenus(props: FloatingMenuProps) {
  return (
    <>
      <SearchReplaceFloatingMenu {...props} />
      <HoverPopupHandler {...props} />
    </>
  );
}
