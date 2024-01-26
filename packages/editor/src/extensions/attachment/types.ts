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

export type WebClipAttachment = BaseAttachment & {
  type: "web-clip";
  src: string;
  title: string;
  width?: string;
  height?: string;
};

export type ImageAttachment = BaseAttachment & {
  type: "image";
  width?: number;
  height?: number;
  src?: string;
  aspectRatio?: number;
} & ImageAlignmentOptions;

export type ImageAlignmentOptions = {
  float?: boolean;
  align?: "center" | "left" | "right";
};

export type Attachment = FileAttachment | WebClipAttachment | ImageAttachment;
