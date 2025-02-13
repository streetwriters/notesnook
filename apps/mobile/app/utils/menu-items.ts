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

import { Item, ItemType } from "@notesnook/core";
import { Monographs } from "../screens/notes/monographs";

export type SideMenuItem = {
  dataType?: ItemType | "monograph";
  data?: Item;
  title: string;
  id: string;
  icon: string;
  onPress?: (item: SideMenuItem) => void;
  onLongPress?: (item: SideMenuItem) => void;
};

export const MenuItemsList: SideMenuItem[] = [
  {
    dataType: "note",
    id: "Notes",
    title: "Notes",
    icon: "note-outline"
  },
  // {
  //   dataType: "notebook",
  //   id: "Notebooks",
  //   title: "Notebooks",
  //   icon: "book-outline"
  // },
  {
    dataType: "note",
    id: "Favorites",
    title: "Favorites",
    icon: "star-outline"
  },
  // {
  //   dataType: "tag",
  //   id: "Tags",
  //   title: "Tags",
  //   icon: "pound"
  // },
  {
    dataType: "reminder",
    id: "Reminders",
    title: "Reminders",
    icon: "bell"
  },
  {
    dataType: "monograph",
    id: "Monographs",
    title: "Monographs",
    icon: "text-box-multiple-outline",
    onPress: () => {
      Monographs.navigate();
    }
  },
  // {
  //   dataType: "note",
  //   id: "Archive",
  //   title: "Archive",
  //   icon: "archive"
  // },
  {
    dataType: "note",
    id: "Trash",
    title: "Trash",
    icon: "delete-outline"
  }
];
