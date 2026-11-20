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

import type { Editor as TiptapEditor } from "@tiptap/core";
import type { Editor } from "./types.js";
import { getQueryStore, type QueryStore } from "./queries/store.js";

export type EditorCommand = { name: string; args?: unknown[] };

export interface EditorController {
  readonly kind: "controller";
  readonly queries: QueryStore;
  run(...commands: EditorCommand[]): void;
  readonly tiptap?: Editor;
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

const controllers = new WeakMap<TiptapEditor, EditorController>();

export function tiptapController(editor: TiptapEditor): EditorController {
  let controller = controllers.get(editor);
  if (!controller) {
    controller = {
      kind: "controller",
      queries: getQueryStore(editor),
      tiptap: editor as Editor,
      run(...commands) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let chain: any = editor.chain().focus();
        for (const command of commands) {
          const fn = chain[command.name];
          if (typeof fn !== "function") return;
          chain = fn.apply(chain, command.args ?? []);
        }
        chain.run();
      }
    };
    controllers.set(editor, controller);
  }
  return controller;
}

export function toController(editor: AnyEditor): EditorController {
  return isEditorController(editor) ? editor : tiptapController(editor);
}

export function createController(options: {
  queries: QueryStore;
  run: (commands: EditorCommand[]) => void;
}): EditorController {
  return {
    kind: "controller",
    queries: options.queries,
    run: (...commands) => options.run(commands)
  };
}
