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

declare module "web-app-editor/types" {
  export interface IEditor {
    focus: (options?: {
      position?: "start" | "end" | { from: number; to: number };
      scrollIntoView?: boolean;
    }) => void;
    undo: () => void;
    redo: () => void;
    updateContent: (content: string) => void;
    attachFiles: (...files: unknown[]) => void;
    sendAttachmentProgress: (hash: string, progress: number) => void;
    startSearch: () => void;
    getContent: () => string;
    getSelection: () => { from: number; to: number };
  }
}

declare module "web-app-editor/tiptap" {
  import type { ComponentType, PropsWithChildren } from "react";
  import type { IEditor } from "web-app-editor/types";

  type Props = PropsWithChildren<{
    id: string;
    onLoad?: (editor?: IEditor) => void;
    onChange?: (content: () => string, ignoreEdit: boolean) => void;
    onContentChange?: () => void;
    onSelectionChange?: (range: { from: number; to: number }) => void;
    onAutoSaveDisabled: () => void;
    onAttachFiles?: (files: File[]) => void;
    content?: () => string | undefined;
    readonly?: boolean;
    spellcheck?: boolean;
    nonce?: number;
    isHydrating?: boolean;
  }>;

  const Tiptap: ComponentType<Props>;
  export default Tiptap;
}

declare module "web-app-editor/manager" {
  type Statistics = {
    words: { total: number; selected?: number };
    characters: { total: number; selected?: number };
    paragraphs: { total: number; selected?: number };
    spaces: { total: number; selected?: number };
  };
  type Session = {
    statistics?: Statistics;
    tableOfContents?: { level: number; title: string; id: string }[];
    canUndo?: boolean;
    canRedo?: boolean;
  };
  type State = { editors: Record<string, Session | undefined> };

  export const useEditorManager: {
    subscribe: (
      selector: (state: State) => Session | undefined,
      listener: (
        current: Session | undefined,
        previous: Session | undefined
      ) => void
    ) => () => void;
  };
}
