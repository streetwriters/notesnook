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
  References,
  Rename,
  Reupload,
  Uploading
} from "../icons";
import { showToast } from "../../utils/toast";
import { hashNavigate } from "../../navigation";
import {
  closeOpenedDialog,
  showPromptDialog
} from "../../common/dialog-controller";
import { store } from "../../stores/attachment-store";
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
import { useEffect, useState } from "react";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { getFormattedDate } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";

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
  attachment: any;
  isSelected?: boolean;
  onSelected?: () => void;
  compact?: boolean;
};
export function Attachment({
  attachment,
  isSelected,
  onSelected,
  compact
}: AttachmentProps) {
  const [status, setStatus] = useState<AttachmentProgressStatus>();

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progress: any) => {
        if (progress.hash === attachment.metadata.hash) {
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
  }, [attachment.metadata.hash]);

  const FileIcon = getFileIcon(attachment.metadata.type);
  return (
    <Box
      as="tr"
      sx={{ height: 30, ":hover": { bg: "hover" } }}
      onContextMenu={(e) => {
        e.preventDefault();
        Menu.openMenu(AttachmentMenuItems(attachment, status));
      }}
      onClick={onSelected}
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
          ) : attachment.failed ? (
            <AttachmentError
              color={"icon-error"}
              size={16}
              title={
                typeof attachment.failed === "object"
                  ? attachment.failed.toString()
                  : attachment.failed
              }
            />
          ) : attachment.working ? (
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
            {attachment.metadata.filename}
          </Text>
        </Flex>
      </td>
      <Text as="td" variant="body">
        {attachment.isDeleting ? (
          <Loading sx={{ flexShrink: 0 }} size={16} title={"Deleting.."} />
        ) : attachment.dateUploaded ? (
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
          formatBytes(attachment.length, compact ? 1 : 2)
        )}
      </Text>
      {!compact && (
        <Text as="td" variant="body">
          {attachment.dateUploaded
            ? getFormattedDate(attachment.dateUploaded, "date")
            : "-"}
        </Text>
      )}
    </Box>
  );
}

const AttachmentMenuItems: (
  attachment: any,
  status?: AttachmentProgressStatus
) => MenuItem[] = (attachment, status) => {
  return [
    {
      type: "button",
      key: "notes",
      title: "Notes",
      icon: References.path,
      menu: {
        items: (attachment.noteIds as string[]).reduce((prev, curr) => {
          const note = db.notes?.note(curr);
          if (!note)
            prev.push({
              type: "button",
              key: curr,
              title: `Note with id ${curr}`,
              onClick: () => showToast("error", "This note does not exist.")
            });
          else
            prev.push({
              type: "button",
              key: note.id,
              title: note.title,
              onClick: () => {
                hashNavigate(`/notes/${curr}/edit`);
                closeOpenedDialog();
              }
            });
          return prev;
        }, [] as MenuItem[])
      }
    },
    {
      type: "button",
      key: "recheck",
      title: "Recheck",
      icon: DoubleCheckmark.path,
      isDisabled: !attachment.dateUploaded,
      onClick: async () => {
        await store.recheck([attachment.metadata.hash]);
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
          description: attachment.metadata.filename,
          defaultValue: attachment.metadata.filename
        });
        if (!newName) return;
        await store.rename(attachment.metadata.hash, newName);
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
          await db.fs?.cancel(attachment.metadata.hash, "download");
        } else await saveAttachment(attachment.metadata.hash);
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
          await db.fs?.cancel(attachment.metadata.hash, "upload");
        } else
          await reuploadAttachment(
            attachment.metadata.type,
            attachment.metadata.hash
          );
      }
    },
    {
      type: "button",
      key: "permanent-delete",
      variant: "dangerous",
      title: "Delete permanently",
      icon: DeleteForver.path,
      onClick: () => Multiselect.deleteAttachments([attachment])
    }
  ];
};
