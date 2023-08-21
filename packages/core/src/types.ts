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
import { TimeFormat } from "./utils/date";

export type GroupOptions = {
  groupBy: "none" | "abc" | "year" | "month" | "week" | "default";
  sortBy: "dateCreated" | "dateDeleted" | "dateEdited" | "title";
  sortDirection: "desc" | "asc";
};

export type GroupedItems<T> = (T | GroupHeader)[];

export type GroupingKey =
  | "home"
  | "notes"
  | "notebooks"
  | "tags"
  | "topics"
  | "trash"
  | "reminders"
  | "favorites";

export type ValueOf<T> = T[keyof T];

export type GroupHeader = {
  type: "header";
  id: string;
  title: string;
};

export type Collections = {
  notes: "note" | "trash";
  notebooks: "notebook" | "trash";
  topics: "topic";
  attachments: "attachment";
  reminders: "reminder";
  relations: "relation";
  content: "tiptap" | "tiny";
  shortcuts: "shortcut";
  tags: "tag";
  colors: "color";
  notehistory: "session";
  sessioncontent: "sessioncontent";
  settings: "settings";
};

export type CollectionType = keyof Collections;

export type ItemType =
  | ValueOf<Collections>
  // TODO: ideally there should be no extra types here.
  // everything should have its own collection
  | "topic"
  | "settings";

export type Item = ValueOf<ItemMap>;
export type GroupableItem = ValueOf<
  Omit<
    ItemMap,
    | "shortcut"
    | "relation"
    | "tiny"
    | "tiptap"
    | "content"
    | "session"
    | "sessioncontent"
    | "settings"
  >
>;

export type ItemMap = {
  note: Note;
  notebook: Notebook;
  topic: Topic;
  attachment: Attachment;
  tag: Tag;
  color: Color;
  trash: TrashItem;
  relation: Relation;
  shortcut: Shortcut;
  reminder: Reminder;
  tiptap: ContentItem;
  tiny: ContentItem;
  content: ContentItem;
  session: HistorySession;
  sessioncontent: SessionContentItem;
  settings: SettingsItem;
};

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

export interface Note extends BaseItem<"note"> {
  title: string;
  headline?: string;
  contentId?: string;

  /**
   * @deprecated only kept here for migration purposes.
   */
  tags?: string[];
  /**
   * @deprecated only kept here for migration purposes.
   */
  color?: string;
  notebooks?: NotebookReference[];

  pinned: boolean;
  locked: boolean;
  favorite: boolean;
  localOnly: boolean;
  conflicted: boolean;
  readonly: boolean;

  dateEdited: number;
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
  dateEdited: number;

  /**
   * @deprecated only kept here for migration purposes.
   */
  notes?: string[];
}

export type AttachmentMetadata = {
  hash: string;
  hashType: string;
  filename: string;
  type: string;
};

export interface Attachment extends BaseItem<"attachment"> {
  noteIds: string[];
  iv: string;
  salt: string;
  length: number;
  alg: string;
  key: Cipher<"base64">;
  chunkSize: number;
  metadata: AttachmentMetadata;
  dateUploaded?: number;
  failed?: string;
  dateDeleted?: number;
}

export interface Color extends BaseItem<"color"> {
  colorCode: string;
  title: string;
}

export interface Tag extends BaseItem<"tag"> {
  title: string;

  /**
   * @deprecated only kept here for migration purposes.
   */
  localOnly?: boolean;
  /**
   * @deprecated only kept here for migration purposes.
   */
  noteIds?: string[];
  /**
   * @deprecated only kept here for migration purposes.
   */
  alias?: string;
}

export type ItemReference = {
  id: string;
  type: keyof ItemMap;
};

export interface Relation extends BaseItem<"relation"> {
  from: ItemReference;
  to: ItemReference;
}

type BaseShortcutReference = {
  id: string;
};

type TagNotebookShortcutReference = BaseShortcutReference & {
  type: "tag" | "notebook";
};

type TopicShortcutReference = BaseShortcutReference & {
  type: "topic";
  notebookId: string;
};

export interface Shortcut extends BaseItem<"shortcut"> {
  item: TopicShortcutReference | TagNotebookShortcutReference;
  sortIndex: number;
}

export interface Reminder extends BaseItem<"reminder"> {
  title: string;
  description?: string;
  priority: "silent" | "vibrate" | "urgent";
  date: number;
  mode: "repeat" | "once" | "permanent";
  recurringMode?: "week" | "month" | "day";
  selectedDays?: number[];
  localOnly?: boolean;
  disabled?: boolean;
  snoozeUntil?: number;
}

export type ContentType = "tiptap" | "tiny";
export interface ContentItem extends BaseItem<ContentType> {
  noteId: string;
  data: string | Cipher<"base64">;
  dateEdited: number;
  localOnly: boolean;
  conflicted?: ContentItem;
  dateResolved?: number;
  sessionId?: string;
}

export type UnencryptedContentItem = Omit<ContentItem, "data"> & {
  data: string;
};

export type EncryptedContentItem = Omit<ContentItem, "data"> & {
  data: Cipher<"base64">;
};

export interface HistorySession extends BaseItem<"session"> {
  sessionContentId: string;
  noteId: string;
  localOnly: boolean;
  locked?: boolean;
}

export interface SessionContentItem extends BaseItem<"sessioncontent"> {
  data: Cipher<"base64"> | string;
  contentType: ContentType;
  compressed: boolean;
  localOnly: boolean;
  locked: boolean;
}

export type TrashCleanupInterval = 1 | 7 | 30 | 365 | -1;
export type ToolbarConfig = { preset: string; config?: any[] };
export type DefaultNotebook = { id: string; topic?: string };
export interface SettingsItem extends BaseItem<"settings"> {
  groupOptions?: Partial<Record<GroupingKey, GroupOptions>>;
  toolbarConfig?: Record<string, ToolbarConfig>;
  trashCleanupInterval?: TrashCleanupInterval;
  titleFormat?: string;
  timeFormat?: TimeFormat;
  dateFormat?: string;
  defaultNotebook?: DefaultNotebook;

  /**
   * @deprecated only kept here for migration purposes.
   */
  aliases?: Record<string, string>;
  /**
   * @deprecated only kept here for migration purposes.
   */
  pins?: {
    type: "tag" | "topic" | "notebook";
    data: { id: string; notebookId: string };
  }[];
}

export interface DeletedItem {
  id: string;
  deleted: true;
  dateModified: number;
  remote?: boolean;
  synced?: boolean;
}

export type MaybeDeletedItem<T> = T | DeletedItem;
export type TrashOrItem<T extends BaseItem<"note" | "notebook">> =
  | T
  | BaseTrashItem<T>;

export type BaseTrashItem<TItem extends BaseItem<"note" | "notebook">> =
  BaseItem<"trash"> & {
    title: string;
    itemType: TItem["type"];
    dateDeleted: number;
  } & Omit<TItem, "id" | "type">;

export type TrashItem = BaseTrashItem<Note> | BaseTrashItem<Notebook>;

export function isDeleted<T extends BaseItem<ItemType>>(
  item: MaybeDeletedItem<T>
): item is DeletedItem {
  return "deleted" in item;
}

export function isTrashItem(
  item: MaybeDeletedItem<TrashOrItem<BaseItem<"note" | "notebook">>>
): item is TrashItem {
  return !isDeleted(item) && item.type === "trash";
}

export function isGroupHeader(item: GroupHeader | Item): item is GroupHeader {
  return item.type === "header";
}
