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

import type { EditorHostActions } from "@notesnook/ui-kit/contracts/editor";
import type { PickedFile } from "@platform/files";

/**
 * What the host actions need from the app. Kept as plain functions so the
 * actions can be tested without the database, the platform or any UI.
 */
export interface HostActionDeps {
  /** Opens a note/notebook/tag link inside the app; false if it is not one. */
  openInternalLink(url: string, openInNewTab?: boolean): boolean;
  openUrl(url: string): void;
  openPath(path: string): Promise<void>;
  /** Saves the attachment where the user chooses (a save dialog). */
  saveAttachment(hash: string): Promise<void>;
  /** Shows an image or document preview. */
  previewAttachment(attachment: {
    hash: string;
    type?: string;
    mime?: string;
  }): Promise<void> | void;
  /** Whether the user may add attachments now (signed in); tells them if not. */
  canAttach(): boolean;
  /** Shows the file picker and attaches what was chosen. */
  pickAndAttach(mime: string): Promise<void>;
  /** Attaches files that were pasted or dropped. */
  attachFiles(files: PickedFile[]): Promise<void> | void;
  /** Downloads if needed, decrypts to a temporary file and returns its path. */
  decryptAttachmentToTempFile(hash: string): Promise<string | undefined>;
  removeTempFile(path: string): Promise<void>;
  /** Shows the note linking dialog; undefined when it is dismissed. */
  pickInternalLink(attributes?: {
    href: string;
    title?: string;
  }): Promise<{ href: string; title?: string } | undefined>;
  onError(message: string): void;
}

export interface DesktopEditorHost extends EditorHostActions {
  /** Deletes the temporary files handed out by `resolveAttachmentPath`. */
  dispose(): Promise<void>;
}

/** `file:///a/b%20c` to `/a/b c` (and `file:///C:/x` to `C:/x`). */
export function pathFromFileUrl(url: string): string | undefined {
  if (!url.startsWith("file:")) return;
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    return /^\/[A-Za-z]:\//.test(path) ? path.slice(1) : path;
  } catch {
    return;
  }
}

const SAFE_URL_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

export function createEditorHostActions(
  deps: HostActionDeps
): DesktopEditorHost {
  // Concurrent requests for the same attachment share one decryption, and a
  // file already decrypted is reused, so a note that shows an image twice
  // decrypts it once.
  const resolved = new Map<string, Promise<string | undefined>>();

  async function resolveAttachmentPath(hash: string) {
    let pending = resolved.get(hash);
    if (!pending) {
      pending = deps.decryptAttachmentToTempFile(hash).catch((e) => {
        deps.onError(e instanceof Error ? e.message : String(e));
        return undefined;
      });
      resolved.set(hash, pending);
      // A failed request is not kept: the next ask tries again.
      if (!(await pending)) resolved.delete(hash);
    }
    return pending;
  }

  return {
    async openLink(url, openInNewTab) {
      if (deps.openInternalLink(url, openInNewTab)) return;
      if (url.startsWith("file:")) {
        const path = pathFromFileUrl(url);
        if (path) await deps.openPath(path);
        return;
      }
      try {
        if (!SAFE_URL_PROTOCOLS.includes(new URL(url).protocol)) return;
      } catch {
        return;
      }
      deps.openUrl(url);
    },

    async downloadAttachment(attachment) {
      if (attachment?.hash) await deps.saveAttachment(attachment.hash);
    },

    async previewAttachment(attachment) {
      if (attachment?.hash) await deps.previewAttachment(attachment);
    },

    async openAttachmentPicker(type) {
      if (!deps.canAttach()) return;
      await deps.pickAndAttach(type === "file" ? "*/*" : "image/*");
    },

    createInternalLink: (attributes) => deps.pickInternalLink(attributes),

    async pasteFiles(files) {
      if (!files.length || !deps.canAttach()) return;
      await deps.attachFiles(files as PickedFile[]);
    },

    resolveAttachmentPath,

    async dispose() {
      const paths = await Promise.all(resolved.values());
      resolved.clear();
      await Promise.all(
        paths.filter((p): p is string => !!p).map((p) => deps.removeTempFile(p))
      );
    }
  };
}
