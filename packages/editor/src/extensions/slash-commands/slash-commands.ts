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

import { Editor, Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { Suggestion } from "@tiptap/suggestion";
import { Icons } from "../../toolbar";
import { SuggestionMenuItem, SuggestionMenuView } from "../suggestion";

const slashCommands: SuggestionMenuItem[] = [
  {
    id: "heading1",
    name: "Heading 1",
    icon: Icons.heading,
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    }
  },
  {
    id: "heading2",
    name: "Heading 2",
    icon: Icons.heading,
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    }
  },
  {
    id: "heading3",
    name: "Heading 3",
    icon: Icons.heading,
    action: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    }
  },
  "|",
  {
    id: "orderedList",
    name: "Ordered List",
    icon: Icons.numberedList,
    action: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    }
  },
  {
    id: "bulletList",
    name: "Bullet List",
    icon: Icons.bulletList,
    action: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    }
  },
  {
    id: "taskList",
    name: "Task List",
    icon: Icons.checkList,
    action: (editor) => {
      editor.chain().focus().toggleTaskList().run();
    }
  },
  {
    id: "outlineList",
    name: "Outline List",
    icon: Icons.outlineList,
    action: (editor) => {
      editor.chain().focus().toggleOutlineList().run();
    }
  },
  "|",
  {
    id: "blockquote",
    name: "Blockquote",
    icon: Icons.blockquote,
    action: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    }
  },
  {
    id: "codeBlock",
    name: "Code Block",
    icon: Icons.codeblock,
    action: (editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    }
  },
  {
    id: "mathBlock",
    name: "Math Block",
    icon: Icons.mathBlock,
    action: (editor) => {
      editor.chain().focus().insertMathBlock().run();
    }
  },
  "|",
  {
    id: "callout",
    name: "Callout",
    icon: Icons.callout,
    action: (editor) => {
      editor.chain().focus().setCallout({ type: "quote" }).run();
    }
  },
  {
    id: "horizontalRule",
    name: "Horizontal Rule",
    icon: Icons.horizontalRule,
    action: (editor) => {
      editor.chain().focus().setHorizontalRule().run();
    }
  },
  {
    id: "table",
    name: "Table",
    icon: Icons.table,
    action: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
    }
  }
];

export const SlashCommands = Extension.create({
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey("slashCommands"),
        startOfLine: true,
        char: "/",
        items: ({ query }) => {
          const filtered: any = [];
          for (const command of slashCommands) {
            if (command === "|") {
              filtered.push(command);
              continue;
            }

            if (query !== "") {
              const q = query.toLowerCase();
              if (!command.name.toLowerCase().includes(q)) {
                continue;
              }
            }
            filtered.push({
              ...command,
              action: (editor: Editor) => {
                const { state, dispatch } = editor.view;
                const from = state.selection.$from;
                const tr = state.tr.deleteRange(from.start(), from.pos);
                dispatch(tr);
                command.action(editor);
                editor.view.focus();
              }
            });
          }

          const items: SuggestionMenuItem[] = [];
          for (let i = 0; i < filtered.length; i++) {
            const item = filtered[i];
            if (item === "|") {
              if (i === 0 || i === filtered.length - 1) {
                continue;
              }
              if (filtered[i + 1] === "|") {
                continue;
              }
              if (items.length === 0) {
                continue;
              }
              if (items[items.length - 1] === "|") {
                continue;
              }
            }
            items.push(item);
          }
          return items;
        },
        render: () => new SuggestionMenuView(this.editor)
      })
    ];
  }
});
