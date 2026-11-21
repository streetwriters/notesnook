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
import { getQueryStore } from "./queries/store.js";
import {
  isEditorController,
  type AnyEditor,
  type EditorController
} from "./controller.js";
import { TIPTAP_TOOLS } from "./toolbar/tools/tiptap.js";
import type { EditorHostActions } from "./host.js";

const controllers = new WeakMap<TiptapEditor, EditorController>();

const HOST_ACTIONS: (keyof EditorHostActions)[] = [
  "openLink",
  "downloadAttachment",
  "previewAttachment",
  "openAttachmentPicker",
  "pasteFiles",
  "resolveAttachmentPath",
  "createInternalLink",
  "getLinkData",
  "copyToClipboard"
];

/**
 * The host actions a Tiptap host supplies through `editor.storage`, read
 * lazily so one the host sets (or clears) later is still seen.
 */
function storageHostActions(editor: TiptapEditor): EditorHostActions {
  const actions: Record<string, unknown> = {};
  for (const name of HOST_ACTIONS) {
    Object.defineProperty(actions, name, {
      enumerable: true,
      get: () => {
        const action = (editor.storage as Record<string, unknown>)[name];
        return typeof action === "function" ? action : undefined;
      }
    });
  }
  return actions as EditorHostActions;
}

export function tiptapController(editor: TiptapEditor): EditorController {
  let controller = controllers.get(editor);
  if (!controller) {
    controller = {
      kind: "controller",
      queries: getQueryStore(editor),
      tiptap: editor as Editor,
      tools: TIPTAP_TOOLS,
      hostActions: storageHostActions(editor),
      onDestroy(listener) {
        editor.on("destroy", listener);
        return () => {
          editor.off("destroy", listener);
        };
      },
      posAtElement(element) {
        try {
          const pos = editor.view.posAtDOM(element, 0);
          return pos < 0 ? undefined : pos;
        } catch {
          return undefined;
        }
      },
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
