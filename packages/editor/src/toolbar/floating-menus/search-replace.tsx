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

import { SearchStorage } from "../../extensions/search-replace";
import { FloatingMenuProps } from "./types";
import { SearchReplacePopup } from "../popups/search-replace";
import { ResponsivePresenter } from "../../components/responsive";
import { getEditorContainer, getToolbarElement } from "../utils/dom";

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
        target: editor.isEditable ? getToolbarElement() : getEditorContainer(),
        isTargetAbsolute: true,
        location: editor.isEditable ? "below" : "top",
        align: "end",
        yOffset: editor.isEditable ? 5 : -50
      }}
      blocking={false}
      focusOnRender={false}
      draggable={false}
    >
      <SearchReplacePopup editor={editor} />
    </ResponsivePresenter>
  );
}
