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

import { Box, Checkbox, Flex, Label, Text } from "@theme-ui/components";
import { formatBytes } from "@notesnook/common";
import {
  AttachmentError,
  Checkmark,
  DeleteForver,
  DoubleCheckmark,
  Download,
  FileDocument,
  FileGeneral,
  FileImage,
  FilePDF,
  FileVideo,
  FileWebClip,
  Icon,
  Loading,
  Rename,
  Reupload,
  Uploading
} from "../icons";
import { hashNavigate } from "../../navigation";
import {
  closeOpenedDialog,
  showPromptDialog
} from "../../common/dialog-controller";
import { store, useStore } from "../../stores/attachment-store";
import { db } from "../../common/db";
import { saveAttachment } from "../../common/attachments";
import { reuploadAttachment } from "../editor/picker";
import { Multiselect } from "../../common/multi-select";
import { Menu } from "../../hooks/use-menu";
import {
  DocumentMimeTypes,
  WebClipMimeType,
  PDFMimeType
} from "@notesnook/core/dist/utils/filename";
import React, { useEffect, useState } from "react";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { getFormattedDate } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { Attachment as AttachmentType } from "@notesnook/core";

const FILE_ICONS: Record<string, Icon> = {
  "image/": FileImage,
  "video/": FileVideo,
  [WebClipMimeType]: FileWebClip
};

for (const mimeType of DocumentMimeTypes) {
  FILE_ICONS[mimeType] = mimeType === PDFMimeType ? FilePDF : FileDocument;
}

function getFileIcon(type: string) {
  for (const mime in FILE_ICONS) {
    if (type.startsWith(mime))
      return FILE_ICONS[mime as keyof typeof FILE_ICONS];
  }
  return FileGeneral;
}

type AttachmentProgressStatus = {
  type: "download" | "upload";
  loaded: number;
  total: number;
};

type AttachmentProps = {
  item: AttachmentType;
  isSelected?: boolean;
  onSelected?: () => void;
  compact?: boolean;
  style?: React.CSSProperties;
  rowRef?: React.Ref<HTMLTableRowElement>;
};
export function Attachment({
  item,
  isSelected,
  onSelected,
  compact,
  rowRef,
  style
}: AttachmentProps) {
  const [status, setStatus] = useState<AttachmentProgressStatus>();
  const processing = useStore((store) => store.processing[item.hash]);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progress: any) => {
        if (progress.hash === item.hash) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setStatus(
            percent < 100
              ? {
                  type: progress.type,
                  loaded: progress.loaded,
                  total: progress.total
                }
              : undefined
          );
        }
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [item.hash]);

  const FileIcon = getFileIcon(item.type);
  return (
    <Box
      as="tr"
      sx={{ height: 30, ":hover": { bg: "hover" } }}
      onContextMenu={(e) => {
        e.preventDefault();
        Menu.openMenu(AttachmentMenuItems(item, status));
      }}
      onClick={onSelected}
      style={style}
      ref={rowRef}
    >
      {!compact && (
        <td>
          <Label>
            <Checkbox
              sx={{
                width: 18,
                height: 18,
                color: isSelected ? "accent" : "icon"
              }}
              checked={isSelected}
              onChange={onSelected}
            />
          </Label>
        </td>
      )}
      <td>
        <Flex
          sx={{
            alignItems: "center",
            maxWidth: compact ? 180 : "95%"
          }}
        >
          {status ? (
            status.type === "download" ? (
              <Download size={16} color="accent" />
            ) : (
              <Uploading size={16} color="accent" />
            )
          ) : processing?.failed || item.failed ? (
            <AttachmentError
              color={"icon-error"}
              size={16}
              title={
                typeof attachment.failed === "object"
                  ? attachment.failed.toString()
                  : attachment.failed
              }
            />
          ) : processing?.working ? (
            <Loading size={16} />
          ) : (
            <FileIcon size={16} />
          )}
          <Text
            variant="body"
            sx={{
              ml: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {item.filename}
          </Text>
        </Flex>
      </td>
      <Text as="td" variant="body">
        {item.dateUploaded ? (
          <DoubleCheckmark
            sx={{ flexShrink: 0 }}
            color={"accent"}
            size={16}
            title={"Uploaded"}
          />
        ) : (
          <Checkmark
            sx={{ flexShrink: 0 }}
            size={16}
            title={"Waiting for upload"}
          />
        )}
      </Text>
      <Text
        as="td"
        variant="body"
        sx={{ color: status ? "accent" : "paragraph" }}
      >
        {status ? (
          <>
            {formatBytes(status.loaded, 1)}/{formatBytes(status.total, 1)}
          </>
        ) : (
          formatBytes(item.size, compact ? 1 : 2)
        )}
      </Text>
      {!compact && (
        <Text as="td" variant="body">
          {item.dateUploaded
            ? getFormattedDate(item.dateUploaded, "date")
            : "-"}
        </Text>
      )}
    </Box>
  );
}

const AttachmentMenuItems: (
  attachment: AttachmentType,
  status?: AttachmentProgressStatus
) => MenuItem[] = (attachment, status) => {
  return [
    {
      key: "notes",
      type: "lazy-loader",
      async items() {
        const menuItems: MenuItem[] = [];
        for await (const note of db.relations.from(attachment, "note")
          .selector) {
          menuItems.push({
            type: "button",
            key: note.id,
            title: note.title,
            onClick: () => {
              hashNavigate(`/notes/${note.id}/edit`);
              closeOpenedDialog();
            }
          });
        }
        return menuItems;
      }
    },
    {
      type: "button",
      key: "recheck",
      title: "Recheck",
      icon: DoubleCheckmark.path,
      isDisabled: !attachment.dateUploaded,
      onClick: async () => {
        await store.recheck([attachment.id]);
      }
    },
    {
      type: "button",
      key: "rename",
      title: "Rename",
      icon: Rename.path,
      onClick: async () => {
        const newName = await showPromptDialog({
          title: "Rename attachment",
          description: attachment.filename,
          defaultValue: attachment.filename
        });
        if (!newName) return;
        await store.rename(attachment.hash, newName);
      }
    },
    {
      type: "button",
      key: "download",
      title: status?.type === "download" ? "Cancel download" : "Download",
      icon: Download.path,
      onClick: async () => {
        const isDownloading = status?.type === "download";
        if (isDownloading) {
          await db.fs().cancel(attachment.hash, "download");
        } else await saveAttachment(attachment.hash);
      }
    },
    {
      type: "button",
      key: "reupload",
      title: status?.type === "upload" ? "Cancel upload" : "Reupload",
      icon: Reupload.path,
      onClick: async () => {
        const isDownloading = status?.type === "upload";
        if (isDownloading) {
          await db.fs().cancel(attachment.hash, "upload");
        } else await reuploadAttachment(attachment.type, attachment.hash);
      }
    },
    {
      type: "button",
      key: "permanent-delete",
      variant: "dangerous",
      title: "Delete permanently",
      icon: DeleteForver.path,
      onClick: () => Multiselect.deleteAttachments([attachment.id])
    }
  ];
};
