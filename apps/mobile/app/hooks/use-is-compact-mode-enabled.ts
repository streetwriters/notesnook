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
import { ItemType } from "@notesnook/core";
import { useSettingStore } from "../stores/use-setting-store";

export function useIsCompactModeEnabled(dataType: ItemType) {
  const [notebooksListMode, notesListMode, searchListMode] = useSettingStore(
    (state) => [
      state.settings.notebooksListMode,
      state.settings.notesListMode,
      state.settings.searchListMode
    ]
  );

  if (
    dataType !== "note" &&
    dataType !== "notebook" &&
    dataType !== "searchResult"
  )
    return false;

  const listMode =
    dataType === "notebook"
      ? notebooksListMode
      : dataType === "searchResult"
        ? searchListMode
        : notesListMode;

  return listMode === "compact";
}
