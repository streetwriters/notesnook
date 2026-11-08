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

import { useEffect, useState, type ReactNode } from "react";
import { formatBytes, getFormattedDate } from "@notesnook/common";
import {
  DocumentMimeTypes,
  PDFMimeType,
  WebClipMimeType,
  type Attachment as AttachmentType
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import {
  Box,
  Checkbox,
  Flex,
  Text,
  type ContextMenuEvent,
  type KeyEvent,
  type MenuItem
} from "@ui";
import {
  AttachmentError,
  CheckIcon,
  Checkmark,
  Checks,
  DoubleCheckmark,
  Download,
  FileDocument,
  FileGeneral,
  FileImage,
  FilePdf,
  FileText,
  FileVideo,
  FileWebClip,
  LinkHorizontal,
  Loading,
  PasswordInvisible,
  PencilSimple,
  Trash,
  Upload,
  Uploading,
  Warning,
  type Icon
} from "../icons";
import { store, useStore } from "../../stores/attachment-store";
import { db } from "../../common/db";
import {
  downloadAttachment,
  previewImageAttachment,
  saveAttachment
} from "../../common/attachments";
import { reuploadAttachment } from "../editor/picker";
import { Multiselect } from "../../common/multi-select";
import { Menu } from "../../hooks/use-menu";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { PromptDialog } from "../../dialogs/prompt";
import { PdfPreviewDialog } from "../../dialogs/pdf-preview-dialog";
import { DialogManager } from "../../common/dialog-manager";
import { showToast } from "../../utils/toast";

const FILE_ICONS: Record<string, Icon> = {
  "image/": FileImage,
  "video/": FileVideo,
  [WebClipMimeType]: FileWebClip
};

for (const mimeType of DocumentMimeTypes) {
  FILE_ICONS[mimeType] = mimeType === PDFMimeType ? FilePdf : FileDocument;
}

function getFileIcon(type: string) {
  for (const mime in FILE_ICONS) {
    if (type.startsWith(mime)) return FILE_ICONS[mime];
  }
  return FileGeneral;
}

type AttachmentProgressStatus = {
  type: "download" | "upload";
  loaded: number;
  total: number;
};

export const ATTACHMENT_COLUMN_WIDTHS = {
  select: 40,
  status: 40,
  size: 100,
  date: 110
} as const;

type AttachmentProps = {
  item: AttachmentType;
  isSelected?: boolean;
  onSelected?: () => void;
  compact?: boolean;
};

export function Attachment({
  item,
  isSelected,
  onSelected,
  compact
}: AttachmentProps) {
  const [status, setStatus] = useState<AttachmentProgressStatus>();
  const processing = useStore((store) => store.processing[item.hash]);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (progress: {
        hash: string;
        type: "download" | "upload";
        loaded: number;
        total: number;
      }) => {
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
  const onContextMenu = (event: ContextMenuEvent) => {
    event.preventDefault();
    event.stopPropagation();
    Menu.openMenu(AttachmentMenuItems(item, status), {
      position: { x: event.pageX, y: event.pageY }
    });
  };
  const onKeyUp = async (event: KeyEvent) => {
    if (event.key === "Delete") {
      await Multiselect.deleteAttachments(
        useSelectionStore.getState().selectedItems
      );
    }
  };

  if (compact) {
    return (
      <Flex
        testID="attachment-item"
        onContextMenu={onContextMenu}
        onPress={onSelected}
        onKeyUp={onKeyUp}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: "radius1",
          height: 23,
          justifyContent: "space-between",
          p: "spacing2",
          width: "100%",
          ":hover": { bg: "hover" }
        }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing3",
            minWidth: 0
          }}
        >
          {processing?.failed || item.failed ? (
            <Warning
              color="icon-error"
              size={13}
              title={processing?.failed || item.failed}
            />
          ) : status || processing?.working ? (
            <Loading color="icon" size={13} />
          ) : (
            <FileText color="icon" size={13} />
          )}
          <Text
            numberOfLines={1}
            sx={{ color: "paragraph", fontSize: "xs", minWidth: 0 }}
          >
            {item.filename}
          </Text>
        </Flex>
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing3",
            flexShrink: 0
          }}
        >
          {item.dateUploaded ? (
            <Checks color="accent" size={13} title={strings.uploaded()} />
          ) : (
            <CheckIcon
              color="paragraph"
              size={13}
              title={strings.waitingForUpload()}
            />
          )}
          <Text
            sx={{
              color: "paragraph",
              fontSize: "3xs",
              whiteSpace: "nowrap"
            }}
          >
            {formatBytes(item.size, 1)}
          </Text>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex
      testID="attachment-item"
      onContextMenu={onContextMenu}
      onPress={onSelected}
      onKeyUp={onKeyUp}
      sx={{
        flexDirection: "row",
        alignItems: "center",
        height: 25,
        ":hover": { bg: "hover" }
      }}
    >
      <Cell width={ATTACHMENT_COLUMN_WIDTHS.select}>
        <Checkbox
          checked={isSelected}
          onChange={() => onSelected?.()}
          sx={{ width: 18, height: 18, color: isSelected ? "accent" : "icon" }}
        />
      </Cell>
      <Flex
        sx={{
          flexDirection: "row",
          flex: 1,
          minWidth: 0,
          alignItems: "center",
          ml: 2
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
            color="icon-error"
            size={16}
            title={processing?.failed || item.failed}
          />
        ) : processing?.working ? (
          <Loading size={16} color="icon" />
        ) : (
          <FileIcon size={16} color="icon" />
        )}
        <Text
          variant="body"
          numberOfLines={1}
          sx={{ ml: 1, minWidth: 0, flexShrink: 1 }}
        >
          {item.filename}
        </Text>
      </Flex>
      <Cell width={ATTACHMENT_COLUMN_WIDTHS.status}>
        {item.dateUploaded ? (
          <DoubleCheckmark
            color="accent"
            size={16}
            title={strings.uploaded()}
          />
        ) : (
          <Checkmark
            color="icon"
            size={16}
            title={strings.waitingForUpload()}
          />
        )}
      </Cell>
      <Cell width={ATTACHMENT_COLUMN_WIDTHS.size}>
        <Text
          variant="body"
          numberOfLines={1}
          sx={{ color: status ? "accent" : "paragraph" }}
        >
          {status
            ? `${formatBytes(status.loaded, 1)}/${formatBytes(status.total, 1)}`
            : formatBytes(item.size, 2)}
        </Text>
      </Cell>
      <Cell width={ATTACHMENT_COLUMN_WIDTHS.date}>
        <Text variant="body">
          {item.dateUploaded
            ? getFormattedDate(item.dateUploaded, "date")
            : "-"}
        </Text>
      </Cell>
    </Flex>
  );
}

function Cell(props: { width: number; children?: ReactNode }) {
  return (
    <Box sx={{ width: props.width, flexShrink: 0, justifyContent: "center" }}>
      {props.children}
    </Box>
  );
}

const AttachmentMenuItems: (
  attachment: AttachmentType,
  status?: AttachmentProgressStatus
) => MenuItem[] = (attachment, status) => {
  return [
    {
      key: "preview-attachment",
      type: "button",
      title: strings.previewAttachment(),
      iconComponent: PasswordInvisible,
      isHidden:
        !attachment.mimeType.startsWith("image/") &&
        attachment.mimeType !== PDFMimeType,
      onClick: async () => {
        if (attachment.mimeType.startsWith("image")) {
          await previewImageAttachment(attachment);
        } else if (attachment.mimeType === PDFMimeType) {
          const base64 = await downloadAttachment(
            attachment.hash,
            "base64",
            attachment.id
          );
          if (!base64) {
            return showToast("error", strings.attachmentPreviewFailed());
          }

          PdfPreviewDialog.show({
            url: `data:${PDFMimeType};base64,${base64}`,
            hash: attachment.hash
          });
        }
      }
    },
    {
      key: "notes",
      type: "button",
      title: strings.linkedNotes(),
      iconComponent: LinkHorizontal,
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
                  iconComponent: FileText,
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
      iconComponent: Checks,
      isDisabled: !attachment.dateUploaded,
      onClick: async () => {
        await store.recheck([attachment.id]);
      }
    },
    {
      type: "button",
      key: "rename",
      title: strings.rename(),
      iconComponent: PencilSimple,
      onClick: async () => {
        const newName = await PromptDialog.show({
          title: strings.doActions.rename.attachment(1),
          description: attachment.filename,
          defaultValue: attachment.filename,
          label: strings.enterTitle()
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
      iconComponent: Download,
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
      iconComponent: Upload,
      onClick: async () => {
        const isDownloading = status?.type === "upload";
        if (isDownloading) {
          await db.fs().cancel(attachment.hash);
        } else await reuploadAttachment(attachment.type, attachment.hash);
      }
    },
    {
      type: "separator",
      key: "separator"
    },
    {
      type: "button",
      key: "permanent-delete",
      variant: "dangerous",
      title: strings.deletePermanently(),
      iconComponent: Trash,
      onClick: () => Multiselect.deleteAttachments([attachment.id])
    }
  ];
};
