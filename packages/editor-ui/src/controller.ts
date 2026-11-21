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

import type { ComponentType } from "react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import type { Editor } from "./types.js";
import type { QueryStore } from "./queries/store.js";
import type { ToolProps } from "./toolbar/types.js";
import type { ToolId } from "./toolbar-data/index.js";
import type { EditorHostActions } from "./host.js";

export type EditorCommand = { name: string; args?: unknown[] };

export type ToolOverrides = Partial<Record<ToolId, ComponentType<ToolProps>>>;

export type ControllerHostActions = EditorHostActions & {
  pickCsvFile?: () => Promise<string | undefined>;
};

export interface EditorController {
  readonly kind: "controller";
  readonly queries: QueryStore;
  run(...commands: EditorCommand[]): void;
  readonly tiptap?: Editor;
  readonly tools?: ToolOverrides;
  readonly hostActions?: ControllerHostActions;
  /** Calls `listener` once when the editor goes away; returns an unsubscribe. */
  onDestroy(listener: () => void): () => void;
  /**
   * The document position of a rendered element (hover popups find what the
   * pointer is over). Only engines that render DOM have it.
   */
  posAtElement?(element: Element): number | undefined;
}

export type AnyEditor = Editor | TiptapEditor | EditorController;

export function isEditorController(
  editor: AnyEditor | null | undefined
): editor is EditorController {
  return (
    !!editor &&
    (editor as Partial<EditorController>).kind === "controller" &&
    !!(editor as Partial<EditorController>).queries
  );
}

export function createController(options: {
  queries: QueryStore;
  run: (commands: EditorCommand[]) => void;
  tools?: ToolOverrides;
  hostActions?: ControllerHostActions;
  onDestroy?: (listener: () => void) => () => void;
  posAtElement?: (element: Element) => number | undefined;
}): EditorController {
  return {
    kind: "controller",
    queries: options.queries,
    tools: options.tools,
    hostActions: options.hostActions,
    run: (...commands) => options.run(commands),
    onDestroy: options.onDestroy ?? (() => () => undefined),
    posAtElement: options.posAtElement
  };
}
