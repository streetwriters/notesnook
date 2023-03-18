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

import { UnionCommands, Editor as TiptapEditor } from "@tiptap/core";

export type Commands = keyof UnionCommands | "exportToCSV";
export type PermissionRequestEvent = CustomEvent<{ id: Commands }>;

export class Editor extends TiptapEditor {
  /**
   * Use this to get the latest instance of the editor.
   * This is required to reduce unnecessary rerenders of
   * toolbar elements.
   */
  current?: TiptapEditor;

  /**
   * Request permission before executing a command to make sure user
   * is allowed to perform the action.
   * @param id the command id to get permission for
   * @returns latest editor instance
   */
  requestPermission(id: Commands): TiptapEditor | undefined {
    const event = new CustomEvent("permissionrequest", {
      detail: { id },
      cancelable: true
    });

    if (!window.dispatchEvent(event)) return undefined;

    return this.current;
  }
}
