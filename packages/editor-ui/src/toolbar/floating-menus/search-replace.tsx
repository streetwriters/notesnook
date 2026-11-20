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

import { FloatingMenuProps } from "./types.js";
import { SearchReplacePopup } from "../popups/search-replace.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { toolbarRef } from "../stores/toolbar-store.js";
import { useEditorSearchStore } from "../stores/search-store.js";

export function SearchReplaceFloatingMenu(props: FloatingMenuProps) {
  const { editor } = props;
  const isSearching = useEditorSearchStore((store) => store.isSearching);

  return (
    <ResponsivePresenter
      mobile="sheet"
      desktop="popup"
      isOpen={isSearching}
      onClose={() => editor.commands.endSearch()}
      anchorRef={toolbarRef}
      placement="bottom-end"
      blocking={false}
      focusOnRender={false}
    >
      <SearchReplacePopup editor={editor} />
    </ResponsivePresenter>
  );
}
