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

import { Editor } from "@tiptap/core";
import { LIST_NODE_TYPES, NODE_NAMES } from "../extension-types.js";

export function isListActive(editor: Editor): boolean {
  return LIST_NODE_TYPES.some((name) => editor.isActive(name));
}

export function findListItemType(editor: Editor): string | null {
  const isTaskList = editor.isActive(NODE_NAMES.taskList);
  const isCheckList = editor.isActive(NODE_NAMES.checkList);
  const isOutlineList = editor.isActive(NODE_NAMES.outlineList);
  const isList =
    editor.isActive(NODE_NAMES.bulletList) ||
    editor.isActive(NODE_NAMES.orderedList);

  return isList
    ? NODE_NAMES.listItem
    : isOutlineList
    ? NODE_NAMES.outlineListItem
    : isTaskList
    ? NODE_NAMES.taskItem
    : isCheckList
    ? NODE_NAMES.checkListItem
    : null;
}
