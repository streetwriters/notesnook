import { SearchStorage } from "../../extensions/search-replace";
import { FloatingMenuProps } from "./types";
import { SearchReplacePopup } from "../popups/search-replace";
import {
  DesktopOnly,
  MobileOnly,
  ResponsivePresenter
} from "../../components/responsive";
import { getToolbarElement } from "../utils/dom";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const { isSearching } = editor.storage.searchreplace as SearchStorage;

  return (
    <ResponsivePresenter
      mobile="sheet"
      desktop="menu"
      isOpen={isSearching}
      onClose={() => editor.commands.endSearch()}
      position={{
        target: getToolbarElement(),
        isTargetAbsolute: true,
        location: "below",
        align: "end",
        yOffset: 5
      }}
      blocking={false}
      focusOnRender={false}
      draggable={false}
    >
      <SearchReplacePopup editor={editor} />
    </ResponsivePresenter>
  );
}
