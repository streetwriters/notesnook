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

import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { MoreTools } from "../components/more-tools.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { findSelectedNode } from "../../utils/prosemirror.js";
import { Attachment } from "../../extensions/attachment/index.js";

export function AttachmentSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("attachment") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="attachmentSettings"
      tools={
        editor.isEditable
          ? ["downloadAttachment"]
          : ["downloadAttachment", "removeAttachment"]
      }
    />
  );
}

export function DownloadAttachment(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        const attachmentNode =
          findSelectedNode(editor, "attachment") ||
          findSelectedNode(editor, "image");

        const attachment = (attachmentNode?.attrs || {}) as Attachment;
        editor.storage.downloadAttachment?.(attachment);
      }}
    />
  );
}

export function PreviewAttachment(props: ToolProps) {
  const { editor } = props;
  const attachmentNode =
    findSelectedNode(editor, "attachment") || findSelectedNode(editor, "image");
  const attachment = (attachmentNode?.attrs || {}) as Attachment;

  if (!editor.isActive("image") && !canPreviewAttachment(attachment))
    return null;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        const attachmentNode =
          findSelectedNode(editor, "attachment") ||
          findSelectedNode(editor, "image");

        const attachment = (attachmentNode?.attrs || {}) as Attachment;
        editor.storage.previewAttachment?.(attachment);
      }}
    />
  );
}

export function RemoveAttachment(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => editor.chain().focus().removeAttachment().run()}
    />
  );
}

const previewableFileExtensions = ["pdf"];
const previewableMimeTypes = ["application/pdf"];

function canPreviewAttachment(attachment: Attachment) {
  if (!attachment) return false;
  if (
    attachment.mime &&
    previewableMimeTypes.some((mime) => attachment.mime.startsWith(mime))
  )
    return true;

  const extension = attachment.filename?.split(".").pop();
  if (!extension) return false;

  return previewableFileExtensions.indexOf(extension) > -1;
}
