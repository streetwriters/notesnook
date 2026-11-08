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

import { notImplemented } from "../../common/not-implemented";

export type Attachment = {
  hash: string;
  filename: string;
  mime: string;
  size: number;
  type?: string;
};

export type AttachFilesMessage =
  | { type: "encrypting"; index: number }
  | { type: "done"; index: number; attachment: Attachment | undefined }
  | { type: "error"; index: number; error: string };

export type AttachmentProgress = {
  type: "encrypt" | "upload" | "download";
  hash: string;
  total: number;
  loaded: number;
};

export async function insertAttachments(
  _type: string,
  _onDone: (attachments: Attachment[]) => void
): Promise<void> {
  notImplemented("insertAttachments")();
}

export async function reuploadAttachment(
  _type: string,
  _expectedFileHash: string
): Promise<void> {
  notImplemented("reuploadAttachment")();
}

export async function attachFiles(
  _files: unknown[],
  _report: (progress: AttachFilesMessage) => void,
  _skipSpecialImageHandling = false
): Promise<void> {
  notImplemented("attachFiles")();
}
