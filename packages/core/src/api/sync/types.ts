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

import { Cipher } from "@notesnook/crypto";

export type SyncableItemType =
  | "note"
  | "shortcut"
  | "notebook"
  | "content"
  | "attachment"
  | "reminder"
  | "relation"
  | "color"
  | "tag"
  | "settings";

export type SyncItem = {
  id: string;
  v: number;
} & Cipher<"base64">;

export const SYNC_COLLECTIONS_MAP = {
  note: "notes",
  notebook: "notebooks",
  shortcut: "shortcuts",
  reminder: "reminders",
  relation: "relations",
  tag: "tags",
  color: "colors"
} as const;

export type SyncTransferItem = {
  items: SyncItem[];
  type: SyncableItemType;
};
