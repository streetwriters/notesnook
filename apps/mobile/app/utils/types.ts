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

// eslint-disable-next-line @typescript-eslint/ban-types
export type LiteralUnion<T extends U, U = string> = T | (U & {});

// types from notesnook-core
export type CollectionTypes =
  | "notes"
  | "notebooks"
  | "attachments"
  | "content"
  | "tags"
  | "colors";
export type EntityTypes =
  | "note"
  | "notebook"
  | "tiny"
  | "topic"
  | "attachment"
  | "settings"
  | "trash"
  | "tag"
  | "color"
  | "header";

export type CollectionEntityTypeMap = {
  notes: "note";
  notebooks: "notebook";
  attachments: "attachment";
  content: "tiny";
  tags: "tag";
  colors: "color";
};

export type Item =
  | NoteType
  | NotebookType
  | TopicType
  | AttachmentType
  | TagType
  | TrashType;

export type MonographType = {
  type: "monograph";
  id: string;
  title: string;
  dateModified: number;
  dateCreated: number;
};

export interface Entity<TType extends EntityTypes> {
  id: string;
  type: TType;
  dateModified: number;
  dateCreated: number;

  // flags
  migrated?: boolean;
  remote?: boolean;
  deleted?: boolean;
}

export type NotebookReference = {
  id: string;
  topics: string[];
};

export interface NoteType extends Entity<"note"> {
  title: string;
  notebooks: NotebookReference[];
  tags: string[];
  dateCreated: number;
  dateEdited: number;

  pinned: boolean;
  locked: boolean;
  favorite: boolean;
  localOnly: boolean;
  conflicted: boolean;
  readonly: boolean;

  contentId?: string;
  headline?: string;
  color?: string;
  content?: {
    data: string;
    type: string;
    isPreview?: boolean;
  };
}

export interface NotebookType extends Entity<"notebook"> {
  title: string;
  description?: string;
  dateCreated: number;
  dateEdited: number;
  pinned: boolean;
  topics: TopicType[];
}

export interface TopicType extends Entity<"topic"> {
  title: string;
  notebookId: string;
  notes: string[];
  dateCreated: number;
  dateEdited: number;
  alias?: string;
}

export interface AttachmentType extends Entity<"attachment"> {
  noteIds: string[];
  iv: string;
  salt: string;
  length: number;
  alg: string; // TODO
  chunkSize: number;
  key: {
    iv: string;
    salt: string;
    length: number;
    cipher: string;
    alg: string; // TODO
  };
  metadata: {
    hash: string;
    hashType: string; // TODO
    filename: string;
    type: string;
  };
  dateCreated: number;
  dateEdited: number;
  dateUploaded: number;
  dateDeleted: number;
}

interface BaseTag<TType extends "tag" | "color"> extends Entity<TType> {
  title: string;
  alias?: string;
  noteIds: string[];
}

export type TagType = BaseTag<"tag">;
export type ColorType = BaseTag<"color">;

type TrashItem<TItem extends Entity<"note" | "notebook">> = Entity<"trash"> & {
  title: string;
  itemType: TItem["type"];
  dateDeleted: number;
  deleted: boolean;
} & Omit<TItem, "id" | "type">;

export type TrashType = TrashItem<NoteType> | TrashItem<NotebookType>;

export interface GroupHeader
  extends Omit<Entity<"header">, "id" | "dateCreated" | "dateModified"> {
  title: string;
}

export type ItemReference = { id: string; type: string };
