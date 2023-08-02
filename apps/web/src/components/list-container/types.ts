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

import { ListProfiles } from "./list-profiles";

export type Item = {
  id: string;
  type: string;
  title: string;

  dateEdited: number;
  dateModified: number;
  dateDeleted: number;
  dateCreated: number;
} & Record<string, unknown>;

export type NotebookReference = Item & { topics: string[] };
export type NotebookType = Item & { topics: Item[] };

export type Context = { type: string } & Record<string, unknown>;
export type ItemWrapperProps<TItem = Item> = {
  item: TItem;
  type: keyof typeof ListProfiles;
  context?: Context;
  compact?: boolean;
};

export type ItemWrapper<TItem = Item> = (
  props: ItemWrapperProps<TItem>
) => JSX.Element | null;

export type Reference = {
  type: "topic" | "notebook";
  url: string;
  title: string;
};

export type ReferencesWithDateEdited = {
  dateEdited: number;
  references: Reference[];
};
