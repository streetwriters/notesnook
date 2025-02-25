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

import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import {
  ArrowLeft,
  ArrowRight,
  ArrowTopRight,
  createIcon,
  Icon,
  Plus,
  Radar,
  Redo,
  Undo,
  Notebook as NotebookIcon,
  Note as NoteIcon,
  Reminder as ReminderIcon,
  Tag as TagIcon
} from "../../components/icons";
import { trashMenuItems } from "../../components/trash-item";
import { hashNavigate, navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { AttachmentsDialog } from "../attachments-dialog";
import { CreateColorDialog } from "../create-color-dialog";
import { noteMenuItems } from "../../components/note";
import { MenuItem } from "@notesnook/ui";
import { notebookMenuItems } from "../../components/notebook";
import { tagMenuItems } from "../../components/tag";
import { useEditorManager } from "../../components/editor/manager";
import Config from "../../utils/config";

export interface BaseCommand {
  id: string;
  type: "command" | "note" | "notebook" | "tag" | "reminder";
}
export interface Command extends BaseCommand {
  title: string;
  group: string;
  icon?: Icon;
  action: (command: Command, options?: { openInNewTab?: boolean }) => void;
  excludeFromRecents?: boolean;
}

export interface RecentCommand extends BaseCommand {
  id: string;
  group: "recent";
}

export const commandActions = {
  command: (command: Command) => getCommandById(command.id)?.action(command),
  note: (command: Command, options?: { openInNewTab?: boolean }) =>
    useEditorStore.getState().openSession(command.id, options),
  notebook: (command: Command) => navigate(`/notebooks/${command.id}`),
  tag: (command: Command) => navigate(`/tags/${command.id}`),
  reminder: (command: Command) => hashNavigate(`/reminders/${command.id}/edit`)
};

export const commandIcons = {
  command: (command: BaseCommand) => getCommandById(command.id)?.icon,
  note: NoteIcon,
  notebook: NotebookIcon,
  tag: TagIcon,
  reminder: ReminderIcon
};

const RECENT_COMMANDS_SAVE_KEY = "commandPalette:recent";

const staticCommands: Command[] = [
  {
    id: "notes",
    title: strings.dataTypesPluralCamelCase.note(),
    icon: ArrowTopRight,
    action: () => navigate("/"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "notebooks",
    title: strings.dataTypesPluralCamelCase.notebook(),
    icon: ArrowTopRight,
    action: () => navigate("/notebooks"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "tags",
    title: strings.dataTypesPluralCamelCase.tag(),
    icon: ArrowTopRight,
    action: () => navigate("/tags"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "favorites",
    title: strings.dataTypesPluralCamelCase.favorite(),
    icon: ArrowTopRight,
    action: () => navigate("/favorites"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "reminders",
    title: strings.dataTypesPluralCamelCase.reminder(),
    icon: ArrowTopRight,
    action: () => navigate("/reminders"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "monographs",
    title: strings.dataTypesPluralCamelCase.monograph(),
    icon: ArrowTopRight,
    action: () => navigate("/monographs"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "trash",
    title: strings.trash(),
    icon: ArrowTopRight,
    action: () => navigate("/trash"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "settings",
    title: strings.settings(),
    icon: ArrowTopRight,
    action: () => hashNavigate("/settings", { replace: true }),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "help",
    title: strings.helpAndSupport(),
    icon: ArrowTopRight,
    action: () => (window.location.href = "https://help.notesnook.com"),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "attachment-manager",
    title: strings.attachmentManager(),
    icon: ArrowTopRight,
    action: () => AttachmentsDialog.show({}),
    group: strings.navigate(),
    type: "command"
  },
  {
    id: "new-note",
    title: strings.newNote(),
    icon: Plus,
    action: () => useEditorStore.getState().newSession(),
    group: strings.create(),
    type: "command"
  },
  {
    id: "new-notebook",
    title: strings.newNotebook(),
    icon: Plus,
    action: () => hashNavigate("/notebooks/create", { replace: true }),
    group: strings.create(),
    type: "command"
  },
  {
    id: "new-tag",
    title: strings.newTag(),
    icon: Plus,
    action: () => hashNavigate("/tags/create", { replace: true }),
    group: strings.create(),
    type: "command"
  },
  {
    id: "new-reminder",
    title: strings.newReminder(),
    icon: Plus,
    action: () => hashNavigate(`/reminders/create`, { replace: true }),
    group: strings.create(),
    type: "command"
  },
  {
    id: "new-color",
    title: strings.newColor(),
    icon: Plus,
    action: () => CreateColorDialog.show(true),
    group: strings.create(),
    type: "command"
  },
  {
    id: "toggle-theme",
    title: strings.toggleTheme(),
    icon: Radar,
    action: () => useThemeStore.getState().toggleColorScheme(),
    group: strings.general(),
    type: "command"
  }
];

export async function getDefaultCommands(): Promise<Command[]> {
  const recentCommands: Command[] = [];
  for (const recentCommand of getRecentCommands()) {
    if (recentCommand.type !== "command") continue;
    const resolvedCommand = await resolveRecentCommand(recentCommand);
    if (resolvedCommand) recentCommands.push(resolvedCommand);
  }

  return [
    ...recentCommands,
    ...(await getActiveNoteCommands()),
    ...(await getActiveNotebookCommands()),
    ...(await getActiveTagCommands()),
    ...getEditorCommands(),
    ...staticCommands
  ];
}

export function getCommandById(id: string): Command | undefined {
  return staticCommands
    .concat(getEditorCommands())
    .find((command) => command.id === id);
}

export async function resolveRecentCommand(
  recentCommand: RecentCommand
): Promise<Command | undefined> {
  const title = await getCommandTitle(recentCommand);
  const action = commandActions[recentCommand.type];
  if (!title || !action) return;

  return {
    id: recentCommand.id,
    group: "recent",
    title: title,
    type: recentCommand.type,
    icon:
      recentCommand.type === "command"
        ? commandIcons.command(recentCommand)
        : commandIcons[recentCommand.type],
    action: action
  };
}

export function getRecentCommands() {
  return Config.get<RecentCommand[]>(RECENT_COMMANDS_SAVE_KEY, []);
}

export function addRecentCommand(command: Command) {
  if (command.excludeFromRecents) return;
  const commands = getRecentCommands();
  const index = commands.findIndex((c) => c.id === command.id);
  if (index > -1) commands.splice(index, 1);
  commands.unshift({
    group: "recent",
    id: command.id,
    type: command.type
  });
  Config.set(RECENT_COMMANDS_SAVE_KEY, commands);
}

export function removeRecentCommand(id: string) {
  const commands = getRecentCommands();
  const index = commands.findIndex((c) => c.id === id);
  if (index > -1) {
    commands.splice(index, 1);
    Config.set(RECENT_COMMANDS_SAVE_KEY, commands);
  }
}

async function getActiveNoteCommands(): Promise<Command[]> {
  const note = useEditorStore.getState().getActiveNote();
  if (!note) return [];
  const group = strings.actionsForNote(note.title);

  const commands: Command[] = [];

  const menuItems =
    note.type !== "trash"
      ? noteMenuItems(note, [note.id], {
          locked: !!(
            await db
              .sql()
              .selectFrom("content")
              .where("noteId", "in", [note.id])
              .select(["noteId", "locked"])
              .executeTakeFirst()
          )?.locked
        })
      : trashMenuItems(note);

  for (const menuItem of menuItems) {
    commands.push(...menuItemToCommands(menuItem, group, "active-note"));
  }

  return commands;
}

async function getActiveNotebookCommands() {
  const context = useNoteStore.getState().context;
  if (context?.type !== "notebook") return [];
  const notebook = await db.notebooks.notebook(context.id);
  if (!notebook) return [];
  const group = strings.actionsForNotebook(notebook.title);

  const commands: Command[] = [];

  const menuItems = notebookMenuItems(notebook, [notebook.id]);
  for (const menuItem of menuItems) {
    commands.push(...menuItemToCommands(menuItem, group, "active-notebook"));
  }

  return commands;
}

async function getActiveTagCommands() {
  const context = useNoteStore.getState().context;
  if (context?.type !== "tag") return [];
  const tag = await db.tags.tag(context.id);
  if (!tag) return [];
  const group = strings.actionsForTag(tag.title);
  const commands: Command[] = [];

  const menuItems = tagMenuItems(tag, [tag.id]);
  for (const menuItem of menuItems) {
    commands.push(...menuItemToCommands(menuItem, group, "active-tag"));
  }

  return commands;
}

function getEditorCommands(): Command[] {
  const session = useEditorStore.getState().getActiveSession();
  if (!session) return [];
  const editor = useEditorManager.getState().editors[session.id];

  const commands: Command[] = [
    {
      id: "new-tab",
      title: strings.newTab(),
      icon: Plus,
      action: () => useEditorStore.getState().addTab(),
      group: strings.editor(),
      type: "command"
    },
    {
      id: "next-tab",
      title: strings.nextTab(),
      icon: ArrowTopRight,
      action: () => useEditorStore.getState().focusNextTab(),
      group: strings.editor(),
      type: "command"
    },
    {
      id: "previous-tab",
      title: strings.previousTab(),
      icon: ArrowTopRight,
      action: () => useEditorStore.getState().focusPreviousTab(),
      group: strings.editor(),
      type: "command"
    },
    {
      id: "close-tab",
      title: strings.closeCurrentTab(),
      icon: Radar,
      action: () => useEditorStore.getState().closeActiveTab(),
      group: strings.editor(),
      type: "command"
    },
    {
      id: "close-all-tabs",
      title: strings.closeAllTabs(),
      icon: Radar,
      action: () => useEditorStore.getState().closeAllTabs(),
      group: strings.editor(),
      type: "command"
    }
  ];

  if (session.type !== "readonly" && (editor.canUndo || editor.canRedo)) {
    commands.push(
      {
        id: "undo",
        title: strings.undo(),
        icon: Undo,
        action: () => editor.editor?.undo(),
        group: strings.editor(),
        type: "command",
        excludeFromRecents: true
      },
      {
        id: "redo",
        title: strings.redo(),
        icon: Redo,
        action: () => editor.editor?.redo(),
        group: strings.editor(),
        type: "command",
        excludeFromRecents: true
      }
    );
  }

  if (useEditorStore.getState().canGoBack) {
    commands.push({
      id: "go-back-in-tab",
      title: strings.goBackInTab(),
      icon: ArrowLeft,
      action: () => useEditorStore.getState().goBack(),
      group: strings.editor(),
      type: "command"
    });
  }

  if (useEditorStore.getState().canGoForward) {
    commands.push({
      id: "go-forward-in-tab",
      title: strings.goForwardInTab(),
      icon: ArrowRight,
      action: () => useEditorStore.getState().goForward(),
      group: strings.editor(),
      type: "command"
    });
  }

  return commands;
}

function menuItemToCommands(
  menuItem: MenuItem,
  group: string,
  idSuffix?: string
): Command[] {
  if (menuItem.type !== "button" || menuItem.isHidden || menuItem.isDisabled)
    return [];

  const commands: Command[] = [];
  if (menuItem.menu) {
    for (const item of menuItem.menu.items) {
      commands.push(
        ...menuItemToCommands(item, group, idSuffix).map((c) => {
          c.title = `${menuItem.title}: ${c.title}`;
          c.id = `${menuItem.key}-${c.id}`;
          return c;
        })
      );
    }
    return commands;
  }

  if (!menuItem.onClick) return commands;
  const _Icon = menuItem.icon ? createIcon(menuItem.icon) : undefined;
  commands.push({
    id: idSuffix ? `${menuItem.key}-${idSuffix}` : menuItem.key,
    title: menuItem.title,
    action: menuItem.onClick,
    group,
    type: "command",
    icon: _Icon,
    excludeFromRecents: true
  });
  return commands;
}

async function getCommandTitle({ id, type }: RecentCommand) {
  switch (type) {
    case "command": {
      const command = getCommandById(id);
      if (!command || typeof command.title !== "string") return;
      return command.title;
    }
    case "note": {
      const note = (await db.notes.all.fields(["notes.title"]).items([id])).at(
        0
      );
      if (!note) return;
      return note.title;
    }
    case "notebook": {
      const notebook = (
        await db.notebooks.all.fields(["notebooks.title"]).items([id])
      ).at(0);
      if (!notebook) return;
      return notebook.title;
    }
    case "tag": {
      const tag = (await db.tags.all.fields(["tags.title"]).items([id])).at(0);
      if (!tag) return;
      return tag.title;
    }
    case "reminder": {
      const reminder = (
        await db.reminders.all.fields(["reminders.title"]).items([id])
      ).at(0);
      if (!reminder) return;
      return reminder.title;
    }
  }
}
