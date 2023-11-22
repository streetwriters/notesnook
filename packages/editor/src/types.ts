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
import { Mutex } from "async-mutex";

export type PermissionRequestEvent = CustomEvent<{ id: keyof UnionCommands }>;

export class Editor extends TiptapEditor {
  private mutex: Mutex = new Mutex();
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
  requestPermission(id: keyof UnionCommands): TiptapEditor | undefined {
    const event = new CustomEvent("permissionrequest", {
      detail: { id },
      cancelable: true
    });

    if (!window.dispatchEvent(event)) return undefined;

    return this.current;
  }

  /**
   * Performs editor state changes in a thread-safe manner using a mutex
   * ensuring that all changes are applied sequentially. Use this when
   * you are getting `RangeError: Applying a mismatched transaction` errors.
   */
  threadsafe(callback: (editor: TiptapEditor) => void) {
    return this.mutex.runExclusive(() =>
      this.current ? callback(this.current) : void 0
    );
  }
}
