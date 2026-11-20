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

/**
 * The shape of the editor's nodes and marks as the toolbar sees them: the
 * attribute types and the schema names. They live here, below the engine, so
 * the toolbar never has to import the Tiptap extensions. The extensions import
 * these types and names back from this package.
 */

export type TextDirections = undefined | "rtl";

export type BaseAttachment = {
  hash: string;
  filename: string;
  mime: string;
  size: number;
  progress?: number;
};

export type FileAttachment = BaseAttachment & {
  type: "file";
};

export type AudioAttachment = BaseAttachment & {
  type: "audio";
};

export type WebClipAttachment = BaseAttachment & {
  type: "web-clip";
  src: string;
  title: string;
  width?: string;
  height?: string;
};

export type ImageAlignmentOptions = {
  float?: boolean;
  align?: "center" | "left" | "right";
};

export type ImageAttachment = BaseAttachment & {
  type: "image";
  width?: number;
  height?: number;
  src?: string;
  aspectRatio?: number;
} & ImageAlignmentOptions;

export type Attachment =
  | FileAttachment
  | AudioAttachment
  | WebClipAttachment
  | ImageAttachment;

export type ImageAttributes = ImageAttachment & {
  textDirection?: TextDirections;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type LinkAttributes = {
  href: string;
  target?: string | null;
  rel?: string | null;
  class?: string | null;
  title?: string | null;
};

export type EmbedSizeOptions = {
  width: number;
  height: number;
};

export type EmbedAttributes = Partial<EmbedSizeOptions> & {
  src: string;
};

export type EmbedAlignmentOptions = {
  align?: "center" | "left" | "right";
  textDirection?: TextDirections;
};

export type Embed = Required<EmbedAttributes> & EmbedAlignmentOptions;

export type SearchResult = {
  from: number;
  to: number;
};

export type SearchStorage = {
  selectedIndex: number;
  selectedText?: string;
  results?: SearchResult[];
};

/** Schema names of the nodes and marks the toolbar reads or writes. */
export const NODE_NAMES = {
  codeBlock: "codeblock",
  link: "link",
  image: "image",
  embed: "embed",
  attachment: "attachment",
  textDirection: "textDirection",
  bulletList: "bulletList",
  orderedList: "orderedList",
  listItem: "listItem",
  taskList: "taskList",
  taskItem: "taskItem",
  outlineList: "outlineList",
  outlineListItem: "outlineListItem",
  checkList: "checkList",
  checkListItem: "checkListItem"
} as const;

export const LIST_NODE_TYPES: string[] = [
  NODE_NAMES.taskList,
  NODE_NAMES.outlineList,
  NODE_NAMES.bulletList,
  NODE_NAMES.orderedList,
  NODE_NAMES.checkList
];

export const LIST_ITEM_NODE_TYPES: string[] = [
  NODE_NAMES.taskItem,
  NODE_NAMES.outlineListItem,
  NODE_NAMES.listItem,
  NODE_NAMES.checkListItem
];
