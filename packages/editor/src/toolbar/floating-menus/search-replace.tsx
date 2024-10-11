/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { useLayoutEffect } from "react";
import { FloatingMenuProps } from "./types.js";
import { SearchReplacePopup } from "../popups/search-replace.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { getToolbarElement } from "../utils/dom.js";
import { useEditorSearchStore } from "../stores/search-store.js";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const isSearching = useEditorSearchStore((store) => store.isSearching);

  useLayoutEffect(() => {
    const { searchTerm, ...options } = useEditorSearchStore.getState();
    if (!options.isSearching) editor.commands.endSearch();
    else editor.commands.search(searchTerm, options);
  }, []);

  return (
    <ResponsivePresenter
      mobile="sheet"
      desktop="popup"
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
