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

export type ClipArea = "full-page" | "visible" | "selection" | "article";

export type ClipMode = "bookmark" | "simplified" | "screenshot" | "complete";

export type ItemReference = {
  id: string;
  title: string;
};

export type NotebookReference = ItemReference;

type SelectedNotebookReference = ItemReference & {
  type: "notebook";
};
type SelectedTagReference = ItemReference & {
  type: "tag";
};

export type SelectedReference =
  | SelectedTagReference
  | SelectedNotebookReference;

export const WEB_EXTENSION_CHANNEL_EVENTS = {
  ON_CREATED: "web-extension-channel-created",
  ON_READY: "web-extension-channel-ready"
} as const;

export type ClipData = {
  height?: number;
  width?: number;
  data: string;
};
