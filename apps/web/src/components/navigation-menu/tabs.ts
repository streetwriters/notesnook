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

import { strings } from "@notesnook/intl";
import { CREATE_BUTTON_MAP } from "../../common";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useTagStore } from "../../stores/tag-store";
import { showSortMenu } from "../group-header";
import {
  Home,
  Icon,
  Notebook as NotebookIcon,
  Plus,
  SortBy,
  Tag as TagIcon
} from "../icons";

export type NavigationTabItem = {
  id: "home" | "notebooks" | "tags";
  icon: Icon;
  title: string;
  actions: {
    id: string;
    title: string;
    icon: Icon;
    onClick: () => void;
  }[];
};

export const tabs: NavigationTabItem[] = [
  {
    id: "home",
    icon: Home,
    title: strings.routes.Home(),
    actions: []
  },
  {
    id: "notebooks",
    icon: NotebookIcon,
    title: strings.routes.Notebooks(),
    actions: [
      {
        id: "create-notebook-button",
        title: CREATE_BUTTON_MAP.notebooks.title,
        icon: Plus,
        onClick: CREATE_BUTTON_MAP.notebooks.onClick
      },
      {
        id: "notebooks-sort-button",
        title: strings.sortBy(),
        icon: SortBy,
        onClick: () =>
          showSortMenu("notebooks", () => useNotebookStore.getState().refresh())
      }
    ]
  },
  {
    id: "tags",
    icon: TagIcon,
    title: strings.routes.Tags(),
    actions: [
      {
        id: "create-tag-button",
        title: CREATE_BUTTON_MAP.tags.title,
        icon: Plus,
        onClick: CREATE_BUTTON_MAP.tags.onClick
      },
      {
        id: "tags-sort-button",
        title: strings.sortBy(),
        icon: SortBy,
        onClick: () =>
          showSortMenu("tags", () => useTagStore.getState().refresh())
      }
    ]
  }
] as const;
