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

/**
 * The actions the editor UI asks its host to perform: opening links, picking,
 * previewing and downloading attachments. The host supplies them; the UI never
 * imports a host. Every action is optional, so a host that lacks one simply
 * does not offer the matching control.
 *
 * Tiptap hosts supply them through `editor.storage` (how they always have),
 * other hosts through a `hostActions` object on the editor. `getHostAction`
 * reads both, so the toolbar behaves the same on either.
 */

import type { LinkData } from "./types.js";

export type HostAttachment = {
  hash: string;
  filename?: string;
  mime?: string;
  size?: number;
  type?: string;
};

export type HostAttachmentPickerType = "image" | "file" | "camera";

/** A file handed over by the host (a paste or a drop), opaque to the UI. */
export type HostFile = {
  name: string;
  size: number;
  type: string;
  uri: string;
};

export interface EditorHostActions {
  openLink?(url: string, openInNewTab?: boolean): void | Promise<void>;
  downloadAttachment?(attachment: HostAttachment): void | Promise<void>;
  previewAttachment?(attachment: HostAttachment): void | Promise<void>;
  openAttachmentPicker?(type: HostAttachmentPickerType): void | Promise<void>;
  /** Files pasted or dropped into the editor; the host attaches them. */
  pasteFiles?(files: HostFile[]): void | Promise<void>;
  /**
   * Decrypts the attachment to a temporary file and returns its path, for
   * engines that cannot take bytes through JS (the native editor).
   */
  resolveAttachmentPath?(hash: string): Promise<string | undefined>;
  /**
   * Lets the user pick a note (or heading) to link to; resolves to the link,
   * or undefined when they cancel.
   */
  createInternalLink?(attributes?: {
    href: string;
    title?: string;
  }): Promise<{ href: string; title?: string } | undefined>;
  /** What an internal link (`nn://...`) points at, for its icon and title. */
  getLinkData?(url: string): Promise<LinkData | undefined>;
  /** Puts text (and optionally its HTML) on the clipboard. */
  copyToClipboard?(text: string, html?: string): void | Promise<void>;
}

export type HostActionName = keyof EditorHostActions;

type HostCarrier = {
  hostActions?: EditorHostActions;
  storage?: object;
};

/** Looks an action up on the editor's host actions, then on its storage. */
export function getHostAction<K extends HostActionName>(
  editor: unknown,
  name: K
): EditorHostActions[K] | undefined {
  const carrier = (editor || {}) as HostCarrier;
  const host = carrier.hostActions as Record<string, unknown> | undefined;
  const fromHost = host?.[name];
  if (typeof fromHost === "function")
    return fromHost.bind(host) as EditorHostActions[K];
  const fromStorage = (
    carrier.storage as Record<string, unknown> | undefined
  )?.[name];
  return typeof fromStorage === "function"
    ? (fromStorage as EditorHostActions[K])
    : undefined;
}

export function hasHostAction(editor: unknown, name: HostActionName): boolean {
  return getHostAction(editor, name) !== undefined;
}

/** Calls a host action if the host has it; returns whether it did. */
export function callHostAction<K extends HostActionName>(
  editor: unknown,
  name: K,
  ...args: Parameters<NonNullable<EditorHostActions[K]>>
): boolean {
  const action = getHostAction(editor, name) as
    | ((...a: unknown[]) => unknown)
    | undefined;
  if (!action) return false;
  action(...args);
  return true;
}
