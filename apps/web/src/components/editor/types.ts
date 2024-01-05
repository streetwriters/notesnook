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

import { ContentType } from "@notesnook/core";
import { Attachment } from "./picker";

export type NoteStatistics = {
  words: {
    total: number;
    selected?: number;
  };
};

export interface IEditor {
  focus: (options?: {
    position?: "start" | "end" | { from: number; to: number };
    scrollIntoView?: boolean;
  }) => void;
  undo: () => void;
  redo: () => void;
  getMediaHashes: () => string[];
  updateContent: (content: string) => void;
  attachFile: (file: Attachment) => void;
  loadWebClip: (hash: string, html: string) => void;
  loadImage: (hash: string, src: string) => void;
  sendAttachmentProgress: (
    hash: string,
    type: "download" | "upload" | "encrypt",
    progress: number
  ) => void;
}

export type PreviewSession = {
  content: { data: string; type: ContentType };
  dateCreated: number;
  dateEdited: number;
};
