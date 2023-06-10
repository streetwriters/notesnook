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
import { formatBytes } from "../../utils/filename";
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
} from "@notesnook/core/utils/filename";
import { useEffect, useState } from "react";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { getFormattedDate } from "../../utils/time";

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

  const Icon = getFileIcon(attachment.metadata.type);
  return (
    <Box
      as="tr"
      sx={{ height: 30, ":hover": { bg: "hover" } }}
      onContextMenu={(e) => {
        e.preventDefault();
        Menu.openMenu(AttachmentMenuItems, {
          attachment,
          status
        });
      }}
      onClick={onSelected}
    >
      {!compact && (
        <td>
          <Label>
            <Checkbox
              sx={{ width: 18, height: 18 }}
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
              <Download size={16} color="primary" />
            ) : (
              <Uploading size={16} color="primary" />
            )
          ) : attachment.failed ? (
            <AttachmentError
              color={"error"}
              size={16}
              title={attachment.failed}
            />
          ) : attachment.working ? (
            <Loading size={16} />
          ) : (
            <Icon size={16} />
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
            color={"primary"}
            size={16}
            title={"Uploaded"}
          />
        ) : (
          <Checkmark
            sx={{ flexShrink: 0 }}
            color={"icon"}
            size={16}
            title={"Waiting for upload"}
          />
        )}
      </Text>
      <Text as="td" variant="body" sx={{ color: status ? "primary" : "text" }}>
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

type MenuActionParams = {
  attachment: any;
  status: AttachmentProgressStatus;
};

type MenuItemValue<T> = T | ((options: MenuActionParams) => T);
type MenuItem = {
  type?: "separator";
  key: string;
  title?: MenuItemValue<string>;
  icon?: MenuItemValue<Icon>;
  onClick?: (options: MenuActionParams) => void;
  disabled?: MenuItemValue<boolean | string>;
  color?: MenuItemValue<string>;
  iconColor?: MenuItemValue<string>;
  multiSelect?: boolean;
  items?: MenuItemValue<MenuItem[]>;
};
const AttachmentMenuItems: MenuItem[] = [
  {
    key: "notes",
    title: "Notes",
    icon: References,
    items: ({ attachment }) =>
      (attachment.noteIds as string[]).reduce((prev, curr) => {
        const note = db.notes?.note(curr);
        if (!note)
          prev.push({
            key: curr,
            title: `Note with id ${curr}`,
            onClick: () => showToast("error", "This note does not exist.")
          });
        else
          prev.push({
            key: note.id,
            title: note.title,
            onClick: () => {
              hashNavigate(`/notes/${curr}/edit`);
              closeOpenedDialog();
            }
          });
        return prev;
      }, [] as MenuItem[])
  },
  {
    key: "recheck",
    title: () => "Recheck",
    icon: DoubleCheckmark,
    disabled: ({ attachment }) =>
      !attachment.dateUploaded ? "This attachment is not uploaded yet." : false,
    onClick: async ({ attachment }) => {
      await store.recheck([attachment.metadata.hash]);
    }
  },
  {
    key: "rename",
    title: () => "Rename",
    icon: Rename,
    onClick: async ({ attachment }) => {
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
    key: "download",
    title: ({ status }) =>
      status?.type === "download" ? "Cancel download" : "Download",
    icon: Download,
    disabled: ({ attachment }) =>
      !attachment.dateUploaded ? "This attachment is not uploaded yet." : false,
    onClick: async ({ attachment, status }) => {
      const isDownloading = status?.type === "download";
      if (isDownloading) {
        await db.fs?.cancel(attachment.metadata.hash, "download");
      } else await saveAttachment(attachment.metadata.hash);
    }
  },
  {
    key: "reupload",
    title: ({ status }) =>
      status?.type === "upload" ? "Cancel upload" : "Reupload",
    icon: Reupload,
    onClick: async ({ attachment, status }) => {
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
    key: "permanent-delete",
    color: "error",
    iconColor: "error",
    title: () => "Delete permanently",
    icon: DeleteForver,
    onClick: ({ attachment }) => Multiselect.deleteAttachments([attachment])
  }
];
