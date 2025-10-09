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

import { Notebook, Tag } from "@notesnook/core";
export type NotebookContext = {
  type: "notebook";
  id: string;
  item?: Notebook;
  totalNotes?: number;
};
export type Context =
  | {
      type: "tag";
      id: string;
      item?: Tag;
    }
  | {
      type: "color";
      id: string;
    }
  | NotebookContext
  | {
      type: "favorite" | "monographs" | "archive";
    };

export type WithDateEdited<T> = { items: T[]; dateEdited: number };
export type NotebooksWithDateEdited = WithDateEdited<Notebook>;
export type TagsWithDateEdited = WithDateEdited<Tag>;
