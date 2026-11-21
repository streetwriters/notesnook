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

import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { SxProp } from "./style";
import type { PickedFile } from "@platform/files";

export interface EditorSelection {
  from: number;
  to: number;
}

export interface EditorAttachment {
  type: "image" | "file" | "web-clip";
  hash: string;
  filename: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * What the editor UI asks its host to do. The host supplies the actions; the
 * surface gives them to the editor UI (which reads them through
 * `@notesnook/editor-ui`'s `getHostAction`). Every action is optional: a host
 * that omits one gets no matching control. Mirrors `EditorHostActions` in
 * `@notesnook/editor-ui`, which cannot import this package.
 */
export interface EditorHostActions {
  openLink?(url: string, openInNewTab?: boolean): void | Promise<void>;
  downloadAttachment?(attachment: {
    hash: string;
    filename?: string;
    mime?: string;
    size?: number;
    type?: string;
  }): void | Promise<void>;
  previewAttachment?(attachment: {
    hash: string;
    filename?: string;
    mime?: string;
    size?: number;
    type?: string;
  }): void | Promise<void>;
  openAttachmentPicker?(
    type: "image" | "file" | "camera"
  ): void | Promise<void>;
  /**
   * Lets the user pick a note (or heading) to link to; resolves to the link,
   * or undefined when they cancel.
   */
  createInternalLink?(attributes?: {
    href: string;
    title?: string;
  }): Promise<{ href: string; title?: string } | undefined>;
  /** Files pasted or dropped into the editor; the host attaches them. */
  pasteFiles?(files: PickedFile[]): void | Promise<void>;
  /**
   * Decrypts the attachment to a temporary file and returns its path, for
   * engines that cannot take bytes through JS (the native editor).
   */
  resolveAttachmentPath?(hash: string): Promise<string | undefined>;
  /**
   * What an internal link (`nn://…`) points to, for the link popups: the type
   * and title of the note, notebook, tag or color. Undefined for other URLs.
   */
  getLinkData?(url: string): Promise<
    | {
        type: "note" | "notebook" | "color" | "tag";
        title?: string;
        metadata?: Record<string, string | undefined>;
      }
    | undefined
  >;
  /** Puts text (and optionally HTML) on the clipboard. */
  copyToClipboard?(text: string, html?: string): void | Promise<void>;
  /** Saves a table exported as CSV where the user chooses (a save dialog). */
  saveCsvFile?(csv: string, filename?: string): void | Promise<void>;
  /** Shows a message for something the editor refused or could not do. */
  reportError?(message: string): void;
}

export interface EditorHeading {
  level: number;
  title: string;
  id: string;
}

export interface EditorStatistics {
  words: { total: number; selected?: number };
  characters: { total: number; selected?: number };
  paragraphs: { total: number; selected?: number };
  spaces: { total: number; selected?: number };
}

export interface EditorHandle {
  focus(options?: {
    position?: "start" | "end" | EditorSelection;
    scrollIntoView?: boolean;
  }): void;
  undo(): void;
  redo(): void;
  updateContent(html: string): void;
  getContent(): string;
  getSelection(): EditorSelection;
  attachFiles(...files: EditorAttachment[]): void;
  sendAttachmentProgress(hash: string, progress: number): void;
  startSearch(): void;
  scrollToHeading(id: string): void;
}

export interface EditorSurfaceProps {
  sessionId: string;
  readonly?: boolean;
  /** Hint shown while the note is empty (the product's `placeholder` option). */
  placeholder?: string;
  nonce?: number;
  content: () => string | undefined;
  onContentChange?: (html: string) => void;
  onSave?: (html: string) => void;
  onSelectionChange?: (selection: EditorSelection) => void;
  onStatisticsChange?: (statistics: EditorStatistics) => void;
  onHeadingsChange?: (headings: EditorHeading[]) => void;
  onUndoRedoChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onPreviewDocument?: (hash: string) => void;
  onReady?: (handle: EditorHandle) => void;
  onAutoSaveDisabled?: () => void;
  onAttachFiles?: (files: PickedFile[]) => void;
  /** Host actions for the editor UI; omit for a host without them. */
  host?: EditorHostActions;
  /**
   * Command ids the user's plan does not allow (`setCallout`,
   * `toggleOutlineList`, `toggleTaskList`, `insertAttachment`). The native
   * editor drops the matching content from pasted HTML. `undefined` until the
   * plan is known; an empty list clears earlier denials.
   */
  deniedPermissions?: readonly string[];
  sx?: SxProp;
  testID?: string;
}

export declare const EditorSurface: ForwardRefExoticComponent<
  EditorSurfaceProps & RefAttributes<EditorHandle>
>;
