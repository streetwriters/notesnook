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

import { DesktopOnly } from "../../components/responsive/index.js";
import { HoverPopupHandler } from "./hover-popup/index.js";
import { SearchReplaceFloatingMenu } from "./search-replace.js";
import { FloatingMenuProps } from "./types.js";

export function EditorFloatingMenus(props: FloatingMenuProps) {
  return (
    <>
      <SearchReplaceFloatingMenu {...props} />

      <DesktopOnly>
        <HoverPopupHandler {...props} />
      </DesktopOnly>
    </>
  );
}
