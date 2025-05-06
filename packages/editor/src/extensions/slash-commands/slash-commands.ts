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
import { strings } from "@notesnook/intl";
import { Level } from "@tiptap/extension-heading";
import { fuzzy } from "@notesnook/core";

const slashCommands = [
  ...[1, 2, 3, 4, 5, 6].map((level) => ({
    id: `heading${level}`,
    name: strings.heading(level),
    group: "heading",
    icon: Icons.heading,
    action: (editor: Editor) => {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: level as Level })
        .run();
    }
  })),
  {
    id: "orderedList",
    name: strings.numberedList(),
    group: "list",
    icon: Icons.numberedList,
    action: (editor: Editor) => {
      editor.chain().focus().toggleOrderedList().run();
    }
  },
  {
    id: "bulletList",
    name: strings.bulletList(),
    group: "list",
    icon: Icons.bulletList,
    action: (editor: Editor) => {
      editor.chain().focus().toggleBulletList().run();
    }
  },
  {
    id: "taskList",
    name: strings.taskList(),
    group: "list",
    icon: Icons.checkList,
    action: (editor: Editor) => {
      editor.chain().focus().toggleTaskList().run();
    }
  },
  {
    id: "outlineList",
    name: strings.outlineList(),
    group: "list",
    icon: Icons.outlineList,
    action: (editor: Editor) => {
      editor.chain().focus().toggleOutlineList().run();
    }
  },
  {
    id: "blockquote",
    name: strings.quote(),
    group: "block",
    icon: Icons.blockquote,
    action: (editor: Editor) => {
      editor.chain().focus().toggleBlockquote().run();
    }
  },
  {
    id: "codeBlock",
    name: strings.codeBlock(),
    group: "block",
    icon: Icons.codeblock,
    action: (editor: Editor) => {
      editor.chain().focus().toggleCodeBlock().run();
    }
  },
  {
    id: "mathBlock",
    name: strings.mathAndFormulas(),
    group: "block",
    icon: Icons.mathBlock,
    action: (editor: Editor) => {
      editor.chain().focus().insertMathBlock().run();
    }
  },
  ...[
    "Abstract",
    "Hint",
    "Info",
    "Success",
    "Warn",
    "Error",
    "Example",
    "Quote"
  ].map((type) => ({
    id: `callout${type}`,
    name: `${strings.callout()} - ${type}`,
    icon: Icons.callout,
    group: "callout",
    action: (editor: Editor) =>
      editor
        .chain()
        .focus()
        .setCallout({ type: type.toLowerCase() as any })
        .run()
  })),
  {
    id: "horizontalRule",
    name: strings.horizontalRule(),
    group: "misc",
    icon: Icons.horizontalRule,
    action: (editor: Editor) => {
      editor.chain().focus().setHorizontalRule().run();
    }
  },
  {
    id: "table",
    name: strings.table(),
    group: "misc",
    icon: Icons.table,
    action: (editor: Editor) => {
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
          const filtered = fuzzy(query, slashCommands, (c) => c.id, {
            name: 10
          });
          const grouped = groupCommands(filtered);
          let suggestionItems: SuggestionMenuItem[] = [];
          for (let i = 0; i < grouped.length; i++) {
            const group = grouped[i];
            suggestionItems = suggestionItems.concat(
              group.map(commandToSuggestionItem)
            );
            if (i < grouped.length - 1) {
              suggestionItems.push("|");
            }
          }
          return suggestionItems;
        },
        render: () => new SuggestionMenuView(this.editor)
      })
    ];
  }
});

function groupCommands(commands: typeof slashCommands) {
  const sortedWrtGroups: (typeof slashCommands)[] = [];
  for (const command of commands) {
    const group = command.group;
    const index = sortedWrtGroups.findIndex((c) => c[0].group === group);
    if (index === -1) {
      sortedWrtGroups.push([command]);
    } else {
      sortedWrtGroups[index].push(command);
    }
  }
  return sortedWrtGroups;
}

function commandToSuggestionItem(
  command: (typeof slashCommands)[number]
): SuggestionMenuItem {
  return {
    id: command.id,
    name: command.name,
    icon: command.icon,
    action: (editor: Editor) => {
      const { state, dispatch } = editor.view;
      const from = state.selection.$from;
      const tr = state.tr.deleteRange(from.start(), from.pos);
      dispatch(tr);
      command.action(editor);
      editor.view.focus();
    }
  };
}
