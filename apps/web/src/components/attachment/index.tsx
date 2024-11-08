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
} from "@notesnook/core";
import React, { useEffect, useState } from "react";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { getFormattedDate } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { Attachment as AttachmentType } from "@notesnook/core";
import { useEditorStore } from "../../stores/editor-store";
import { PromptDialog } from "../../dialogs/prompt";
import { DialogManager } from "../../common/dialog-manager";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { strings } from "@notesnook/intl";

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
        e.stopPropagation();
        Menu.openMenu(AttachmentMenuItems(item, status));
      }}
      onClick={onSelected}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.deleteAttachments(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
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
            alignItems: "center"
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
              title={processing?.failed || item.failed}
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
            title={strings.uploaded()}
          />
        ) : (
          <Checkmark
            sx={{ flexShrink: 0 }}
            size={16}
            title={strings.waitingForUpload()}
          />
        )}
      </Text>
      <Text
        as="td"
        variant="body"
        sx={{
          color: status ? "accent" : "paragraph",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
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
      type: "button",
      title: strings.linkedNotes(),
      icon: References.path,
      menu: {
        items: [
          {
            type: "lazy-loader",
            key: "linked-notes",
            async items() {
              const menuItems: MenuItem[] = [];
              for (const note of await db.relations
                .to(attachment, "note")
                .selector.fields(["notes.id", "notes.title"])
                .items()) {
                menuItems.push({
                  type: "button",
                  key: note.id,
                  title: note.title,
                  onClick: () => {
                    useEditorStore.getState().openSession(note.id);
                    DialogManager.closeAll();
                  }
                });
              }
              if (menuItems.length <= 0)
                menuItems.push({
                  type: "button",
                  key: "no-linked-note",
                  title: strings.noLinkedNotes()
                });
              return menuItems;
            }
          }
        ]
      }
    },
    {
      type: "button",
      key: "recheck",
      title: strings.fileCheck(),
      icon: DoubleCheckmark.path,
      isDisabled: !attachment.dateUploaded,
      onClick: async () => {
        await store.recheck([attachment.id]);
      }
    },
    {
      type: "button",
      key: "rename",
      title: strings.rename(),
      icon: Rename.path,
      onClick: async () => {
        const newName = await PromptDialog.show({
          title: strings.doActions.rename.attachment(1),
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
      title:
        status?.type === "download"
          ? strings.network.cancelDownload()
          : strings.network.download(),
      icon: Download.path,
      onClick: async () => {
        const isDownloading = status?.type === "download";
        if (isDownloading) {
          await db.fs().cancel(attachment.hash);
        } else await saveAttachment(attachment.hash);
      }
    },
    {
      type: "button",
      key: "reupload",
      title:
        status?.type === "upload"
          ? strings.network.cancelUpload()
          : strings.network.reupload(),
      icon: Reupload.path,
      onClick: async () => {
        const isDownloading = status?.type === "upload";
        if (isDownloading) {
          await db.fs().cancel(attachment.hash);
        } else await reuploadAttachment(attachment.type, attachment.hash);
      }
    },
    {
      type: "button",
      key: "permanent-delete",
      variant: "dangerous",
      title: strings.deletePermanently(),
      icon: DeleteForver.path,
      onClick: () => Multiselect.deleteAttachments([attachment.id])
    }
  ];
};
