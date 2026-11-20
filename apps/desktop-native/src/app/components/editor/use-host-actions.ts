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

import { useEffect, useMemo } from "react";
import { shell } from "@platform";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import { handleInternalLink } from "../../common";
import { parseInternalLink } from "@notesnook/core";
import {
  decryptAttachmentToTempFile,
  previewImageAttachment,
  saveAttachment
} from "../../common/attachments";
import { removeTempFile } from "../../common/fs";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useUserStore } from "../../stores/user-store";
import { AttachFilesDialog } from "../../dialogs/attach-files-dialog";
import { ConfirmDialog } from "../../dialogs/confirm";
import { NoteLinkingDialog } from "../../dialogs/note-linking-dialog";
import { showToast } from "../../utils/toast";
import { insertAttachments, type Attachment } from "./picker";
import { useEditorManager } from "./manager";
import {
  createEditorHostActions,
  type DesktopEditorHost,
  type HostActionDeps
} from "./host-actions";

function attachToEditor(sessionId: string) {
  return (attachments: Attachment[]) =>
    useEditorManager
      .getState()
      .getEditor(sessionId)
      ?.editor?.attachFiles(...attachments);
}

function appDeps(sessionId: string): HostActionDeps {
  return {
    openInternalLink(url, openInNewTab) {
      if (!parseInternalLink(url)) return false;
      void handleInternalLink(url, openInNewTab);
      return true;
    },
    openUrl: (url) => shell.openUrl(url),
    openPath: (path) => shell.openPath(path),
    saveAttachment,
    async previewAttachment({ hash, type }) {
      try {
        const attachment = await db.attachments.attachment(hash);
        if (!attachment) throw new Error(`No attachment found with hash ${hash}`);
        if (attachment.mimeType.startsWith("image/") || type === "image") {
          await previewImageAttachment(attachment);
        } else if (attachment.mimeType.startsWith("application/pdf")) {
          useEditorStore.setState({ documentPreview: { hash } });
        } else {
          showToast("error", strings.attachmentPreviewFailed());
        }
      } catch (e) {
        showToast(
          "error",
          (e as Error).message || strings.attachmentPreviewFailed()
        );
      }
    },
    canAttach() {
      if (useUserStore.getState().isLoggedIn) return true;
      ConfirmDialog.show({
        title: strings.notLoggedIn(),
        subtitle: strings.loginToUploadAttachments(),
        positiveButtonText: strings.okay()
      });
      return false;
    },
    pickAndAttach: (mime) => insertAttachments(mime, attachToEditor(sessionId)),
    async attachFiles(files) {
      await AttachFilesDialog.show({ files, onDone: attachToEditor(sessionId) });
    },
    async pickInternalLink(attributes) {
      const link = await NoteLinkingDialog.show({ attributes });
      return link || undefined;
    },
    decryptAttachmentToTempFile,
    removeTempFile,
    onError: (message) => showToast("error", message)
  };
}

/**
 * The editor's host actions for one session: what the editor UI calls to open
 * a link, preview or download an attachment, pick files or paste them, and
 * what the native editor calls to get a decrypted file path. Temporary files
 * are deleted when the session's editor goes away.
 */
export function useEditorHostActions(sessionId: string): DesktopEditorHost {
  const host = useMemo(
    () => createEditorHostActions(appDeps(sessionId)),
    [sessionId]
  );
  useEffect(() => () => void host.dispose(), [host]);
  return host;
}
