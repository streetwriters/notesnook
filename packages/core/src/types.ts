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

export type SortOptions = {
  sortBy:
    | "dateCreated"
    | "dateDeleted"
    | "dateEdited"
    | "dateModified"
    | "title"
    | "filename"
    | "size"
    | "dateUploaded";
  sortDirection: "desc" | "asc";
};

export type GroupOptions = SortOptions & {
  groupBy: "none" | "abc" | "year" | "month" | "week" | "default";
};

export type GroupedItems<T> = (T | GroupHeader)[];

export type GroupingKey =
  | "home"
  | "notes"
  | "notebooks"
  | "tags"
  //| "topics"
  | "trash"
  | "reminders"
  | "favorites";

export type ValueOf<T> = T[keyof T];
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>; // Pick<, K> & Omit<T, K>;

export type GroupHeader = {
  type: "header";
  id: string;
  title: string;
};

export type Collections = {
  notes: "note" | "trash";
  notebooks: "notebook" | "trash";
  attachments: "attachment";
  reminders: "reminder";
  relations: "relation";
  content: "tiptap" | "tiny";
  shortcuts: "shortcut";
  tags: "tag";
  colors: "color";
  notehistory: "session";
  sessioncontent: "sessioncontent";
  settingsv2: "settingitem";
  vaults: "vault";

  /**
   * @deprecated only kept here for migration purposes
   */
  settings: "settings";
  /**
   * @deprecated only kept here for migration purposes
   */
  topics: "topic";
};

export type CollectionType = keyof Collections;

export type ItemType = ValueOf<Collections>;

export type Item = ValueOf<ItemMap>;
export type GroupableItem = ValueOf<
  Omit<
    ItemMap,
    | "shortcut"
    | "relation"
    | "tiny"
    | "topic"
    | "tiptap"
    | "content"
    | "session"
    | "sessioncontent"
    | "settings"
    | "settingitem"
    | "vault"
  >
>;

export type ItemMap = {
  note: Note;
  notebook: Notebook;
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
  settingitem: SettingItem;
  vault: Vault;

  /**
   * @deprecated only kept here for migration purposes
   */
  topic: Topic;
  /**
   * @deprecated only kept here for migration purposes
   */
  settings: LegacySettingsItem;
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
  deleted?: boolean;
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
  /**
   * @deprecated only kept here for migration purposes.
   */
  notebooks?: NotebookReference[];
  /**
   * @deprecated
   */
  locked?: boolean;

  pinned: boolean;
  favorite: boolean;
  localOnly: boolean;
  conflicted: boolean;
  readonly: boolean;

  dateEdited: number;

  dateDeleted: null;
  itemType: null;
  deletedBy: null;
}

export interface Notebook extends BaseItem<"notebook"> {
  title: string;
  description?: string;
  dateEdited: number;
  pinned: boolean;

  /**
   * @deprecated only kept here for migration purposes.
   */
  topics?: Topic[];
  /**
   * @deprecated only kept here for migration purposes.
   */
  totalNotes?: number;

  dateDeleted: null;
  itemType: null;
  deletedBy: null;
}

/**
 * @deprecated only kept here for migration purposes.
 */
export interface Topic extends BaseItem<"topic"> {
  title: string;
  notebookId: string;
  dateEdited: number;

  /**
   * @deprecated only kept here for migration purposes.
   */
  notes?: string[];
}

/**
 * @deprecated only kept here for migration purposes
 */
export type AttachmentMetadata = {
  hash: string;
  hashType: string;
  filename: string;
  type: string;
};

export interface Attachment extends BaseItem<"attachment"> {
  iv: string;
  salt: string;
  alg: string;
  chunkSize: number;

  dateUploaded?: number;
  failed?: string;
  dateDeleted?: number;

  filename: string;
  size: number;
  hash: string;
  hashType: string;
  mimeType: string;

  key: Cipher<"base64">;

  /**
   * @deprecated only kept here for migration purposes
   */
  length?: number;
  /**
   * @deprecated only kept here for migration purposes
   */
  metadata?: AttachmentMetadata;
  /**
   * @deprecated only kept here for migration purposes
   */
  noteIds?: string[];
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
  fromId: string;
  fromType: keyof ItemMap;
  toId: string;
  toType: keyof ItemMap;

  /**
   * @deprecated only kept here for migration purposes
   */
  from?: ItemReference;
  /**
   * @deprecated only kept here for migration purposes
   */
  to?: ItemReference;
}

/**
 * @deprecated only kept here for migration purposes
 */
type BaseShortcutReference = {
  id: string;
};

/**
 * @deprecated only kept here for migration purposes
 */
type TagNotebookShortcutReference = BaseShortcutReference & {
  type: "tag" | "notebook";
};

/**
 * @deprecated only kept here for migration purposes
 */
type TopicShortcutReference = BaseShortcutReference & {
  type: "topic";
  notebookId: string;
};

export interface Shortcut extends BaseItem<"shortcut"> {
  itemId: string;
  itemType: "tag" | "notebook";

  /**
   * @deprecated only kept here for migration purposes
   */
  item?: TopicShortcutReference | TagNotebookShortcutReference;

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
export interface BaseContentItem extends BaseItem<ContentType> {
  noteId: string;
  dateEdited: number;
  localOnly: boolean;
  dateResolved?: number;
  sessionId?: string;
  conflicted?: UnencryptedContentItem;
}

export type UnencryptedContentItem = BaseContentItem & {
  data: string;
  locked: false;
};

export type EncryptedContentItem = BaseContentItem & {
  data: Cipher<"base64">;
  locked: true;
};

export type ContentItem = EncryptedContentItem | UnencryptedContentItem;

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
/**
 * @deprecated only kept here for migration purposes
 */
export interface LegacySettingsItem extends BaseItem<"settings"> {
  groupOptions?: Partial<Record<GroupingKey, GroupOptions>>;
  toolbarConfig?: Partial<Record<ToolbarConfigPlatforms, ToolbarConfig>>;
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

export type ToolbarConfigPlatforms = "desktop" | "mobile";
export type SideBarSection = "builtin" | "colors" | "shortcuts";
export type SideBarHideableSection = "builtin" | "colors";
export type SettingItemMap = {
  trashCleanupInterval: TrashCleanupInterval;
  titleFormat: string;
  timeFormat: TimeFormat;
  dateFormat: string;
  defaultNotebook: string | undefined;
} & Record<`groupOptions:${GroupingKey}`, GroupOptions> &
  Record<`toolbarConfig:${ToolbarConfigPlatforms}`, ToolbarConfig | undefined> &
  Record<`sideBarOrder:${SideBarSection}`, string[]> &
  Record<`sideBarHiddenItems:${SideBarHideableSection}`, string[]>;

export interface SettingItem<
  TKey extends keyof SettingItemMap = keyof SettingItemMap
> extends BaseItem<"settingitem"> {
  key: TKey;
  value: SettingItemMap[TKey];
}

export interface Vault extends BaseItem<"vault"> {
  title: string;
  key: Cipher<"base64">;
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
    itemType: TItem["type"];
    dateDeleted: number;
    /**
     * deletedBy tells who deleted this specific item.
     */
    deletedBy: "user" | "app";
  } & Omit<TItem, "id" | "type" | "dateDeleted" | "itemType" | "deletedBy">;

export type TrashItem = BaseTrashItem<Note> | BaseTrashItem<Notebook>;

export function isDeleted(item: object): item is DeletedItem {
  return "deleted" in item && !!item.deleted;
}

export function isTrashItem(item: MaybeDeletedItem<Item>): item is TrashItem {
  return !isDeleted(item) && item.type === "trash";
}

export function isGroupHeader(item: any): item is GroupHeader {
  return item.type === "header";
}
