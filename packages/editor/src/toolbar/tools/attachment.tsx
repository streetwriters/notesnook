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

import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../../utils/prosemirror";
import { Attachment } from "../../extensions/attachment";

export function AttachmentSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (
    (!editor.isActive("attachment") && !editor.isActive("image")) ||
    !isBottom
  )
    return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="attachmentSettings"
      tools={["downloadAttachment", "removeAttachment"]}
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
        editor.current?.chain().focus().downloadAttachment(attachment).run();
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
        editor.current?.commands.previewAttachment(attachment);
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
      onClick={() => editor.current?.chain().focus().removeAttachment().run()}
    />
  );
}

const previewableFileExtensions = ["pdf"];
const previewableMimeTypes = ["application/pdf"];

function canPreviewAttachment(attachment: Attachment) {
  if (!attachment) return false;
  if (previewableMimeTypes.some((mime) => attachment.mime.startsWith(mime)))
    return true;

  const extension = attachment.filename?.split(".").pop();
  if (!extension) return false;

  return previewableFileExtensions.indexOf(extension) > -1;
}
