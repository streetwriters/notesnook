import {
  ActionSheetPresenter,
  MenuPresenter,
  PopupPresenter,
} from "../../components/menu/menu";
import { SearchStorage } from "../../extensions/search-replace";
import { FloatingMenuProps } from "./types";
import { SearchReplacePopup } from "../popups/search-replace";
import { DesktopOnly, MobileOnly } from "../../components/responsive";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const { isSearching } = editor.storage.searchreplace as SearchStorage;

  if (!isSearching) return null;
  return (
    <>
      <PopupPresenter
        mobile="sheet"
        desktop="menu"
        isOpen
        onClose={() => editor.commands.endSearch()}
        options={{
          type: "autocomplete",
          position: {
            target:
              document.querySelector<HTMLElement>(".editor-toolbar") || "mouse",
            isTargetAbsolute: true,
            location: "below",
            align: "end",
          },
        }}
      >
        <SearchReplacePopup editor={editor} />
      </PopupPresenter>
    </>
  );
}
