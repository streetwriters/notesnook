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

import type { ToolOverrides } from "../../controller.js";
import { tiptapOnly } from "./tiptap-only.js";
import { InsertBlock } from "./block.js";
import {
  ImageSettings,
  ImageAlignCenter,
  ImageAlignLeft,
  ImageAlignRight,
  ImageProperties
} from "./image.js";
import {
  AttachmentSettings,
  DownloadAttachment,
  PreviewAttachment,
  RemoveAttachment
} from "./attachment.js";
import {
  EmbedAlignCenter,
  EmbedAlignLeft,
  EmbedAlignRight,
  EmbedProperties,
  EmbedSettings
} from "./embed.js";
import {
  WebClipFullScreen,
  WebClipSettings,
  WebClipOpenExternal,
  WebClipOpenSource
} from "./web-clip.js";

export const TIPTAP_TOOLS: ToolOverrides = {
  insertBlock: tiptapOnly(InsertBlock),

  imageSettings: tiptapOnly(ImageSettings),
  imageAlignCenter: tiptapOnly(ImageAlignCenter),
  imageAlignLeft: tiptapOnly(ImageAlignLeft),
  imageAlignRight: tiptapOnly(ImageAlignRight),
  imageProperties: tiptapOnly(ImageProperties),

  embedAlignCenter: tiptapOnly(EmbedAlignCenter),
  embedAlignLeft: tiptapOnly(EmbedAlignLeft),
  embedAlignRight: tiptapOnly(EmbedAlignRight),
  embedProperties: tiptapOnly(EmbedProperties),
  embedSettings: tiptapOnly(EmbedSettings),

  webclipFullScreen: tiptapOnly(WebClipFullScreen),
  webclipOpenExternal: tiptapOnly(WebClipOpenExternal),
  webclipOpenSource: tiptapOnly(WebClipOpenSource),
  webclipSettings: tiptapOnly(WebClipSettings),

  previewAttachment: tiptapOnly(PreviewAttachment),
  attachmentSettings: tiptapOnly(AttachmentSettings),
  downloadAttachment: tiptapOnly(DownloadAttachment),
  removeAttachment: tiptapOnly(RemoveAttachment)
};
