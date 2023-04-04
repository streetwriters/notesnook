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

import { Cipher } from "@notesnook/crypto/dist/src/types";
import { ValueOf } from "./types";

export type Collections = {
  notes: "note" | "trash";
  notebooks: "notebook" | "trash";
  attachments: "attachment";
  reminders: "reminder";
  relations: "relation";
  content: "tiny" | "tiptap";
  shortcuts: "shortcut";
  tags: "tag";
  colors: "color";
};

export type CollectionType = keyof Collections;

export type ItemType =
  | ValueOf<Collections>
  // TODO: ideally there should be no extra types here.
  // everything should have its own collection
  | "topic"
  | "settings";

export type Item =
  | Note
  | Notebook
  | Topic
  | Attachment
  | Tag
  | Trash
  | Relation;

/**
 * Base item type from which all other item types derive containing
 * all the common properties
 */
export interface BaseItem<TType extends ItemType> {
  id: string;
  type: TType;
  dateModified: number;
  dateCreated: number;

  // flags
  migrated?: boolean;
  remote?: boolean;
  synced?: boolean;
}

export type NotebookReference = {
  id: string;
  topics: string[];
};

export interface DeletedItem {
  id: string;
  deleted: true;
}

export type MaybeDeletedItem<T> = T | DeletedItem;
export type TrashOrItem<T extends BaseItem<"note" | "notebook">> =
  | T
  | TrashItem<T>;

export interface Note extends BaseItem<"note"> {
  title: string;
  notebooks: NotebookReference[];
  tags: string[];
  dateEdited: number;

  pinned: boolean;
  locked: boolean;
  favorite: boolean;
  localOnly: boolean;
  conflicted: boolean;
  readonly: boolean;

  contentId?: string;
  sessionId?: string;
  headline?: string;
  color?: string;
}

export interface Notebook extends BaseItem<"notebook"> {
  title: string;
  description?: string;
  dateEdited: number;
  pinned: boolean;
  topics: Topic[];
}

export interface Topic extends BaseItem<"topic"> {
  title: string;
  notebookId: string;
  notes: string[];
  dateEdited: number;
}

export interface Attachment extends BaseItem<"attachment"> {
  noteIds: string[];
  iv: string;
  salt: string;
  length: number;
  alg: string; // TODO
  chunkSize: number;
  key: Cipher;
  metadata: {
    hash: string;
    hashType: string; // TODO
    filename: string;
    type: string;
  };

  dateEdited: number;
  dateUploaded: number;
  dateDeleted: number;
}

export type ItemReference = {
  id: string;
  type: ItemType;
};

export interface Relation extends BaseItem<"relation"> {
  from: ItemReference;
  to: ItemReference;
}

interface BaseTag<TType extends "tag" | "color"> extends BaseItem<TType> {
  title: string;
  alias?: string;
  noteIds: string[];
}

export type Tag = BaseTag<"tag">;
export type Color = BaseTag<"color">;

type TrashItem<TItem extends BaseItem<"note" | "notebook">> =
  BaseItem<"trash"> & {
    title: string;
    itemType: TItem["type"];
    dateDeleted: number;
  } & Omit<TItem, "id" | "type">;

type Trash = TrashItem<Note> | TrashItem<Notebook>;

export function isDeleted<T extends BaseItem<ItemType>>(
  item: T | MaybeDeletedItem<T>
): item is DeletedItem {
  return "deleted" in item;
}

export function isTrashItem(
  item: MaybeDeletedItem<TrashOrItem<BaseItem<"note" | "notebook">>>
): item is Trash {
  return !isDeleted(item) && item.type === "trash";
}
