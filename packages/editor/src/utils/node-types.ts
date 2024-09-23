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

import { TaskList } from "@tiptap/extension-task-list";
import { BulletList } from "@tiptap/extension-bullet-list";
import { ListItem } from "@tiptap/extension-list-item";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { OutlineList } from "../extensions/outline-list/index.js";
import { OutlineListItem } from "../extensions/outline-list-item/index.js";
import { TaskItem } from "@tiptap/extension-task-item";

export const LIST_NODE_TYPES = [
  TaskList.name,
  OutlineList.name,
  BulletList.name,
  OrderedList.name
];

export const LIST_ITEM_NODE_TYPES = [
  TaskItem.name,
  OutlineListItem.name,
  ListItem.name
];
