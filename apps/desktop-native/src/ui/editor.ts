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

export interface EditorSelection {
  from: number;
  to: number;
}

export interface EditorAttachment {
  hash: string;
  filename: string;
  mime: string;
  size: number;
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
  sx?: SxProp;
  testID?: string;
}

export declare const EditorSurface: ForwardRefExoticComponent<
  EditorSurfaceProps & RefAttributes<EditorHandle>
>;
