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

import { db } from "../../common/db";
import {
  Icon,
  Note as NoteIcon,
  Notebook as NotebookIcon,
  Reminder as ReminderIcon,
  Tag as TagIcon
} from "../../components/icons";
import { hashNavigate, navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import Config from "../../utils/config";
import { commands as COMMANDS } from "./commands";

export interface Command {
  id: string;
  title: string;
  type: "command" | "note" | "notebook" | "tag" | "reminder";
  group: string;
}

const CommandIconMap = COMMANDS.reduce((acc, command) => {
  acc.set(command.id, command.icon);
  return acc;
}, new Map<string, Icon>());

const CommandActionMap = COMMANDS.reduce((acc, command) => {
  acc.set(command.id, command.action);
  return acc;
}, new Map<string, (arg?: any) => void>());

const CommandTypeItems = COMMANDS.map((c) => ({
  id: c.id,
  title: c.title,
  group: c.group,
  type: "command" as const
}));

export class CommandPaletteUtils {
  static defaultCommands() {
    return CommandPaletteUtils.recentCommands().concat(CommandTypeItems);
  }

  static addRecentCommand(command: Command) {
    let recentCommands = CommandPaletteUtils.recentCommands();
    const index = recentCommands.findIndex((c) => c.id === command.id);
    if (index > -1) {
      recentCommands.splice(index, 1);
    }
    recentCommands.unshift({
      ...command,
      group: "recent"
    });
    if (recentCommands.length > 3) {
      recentCommands = recentCommands.slice(0, 3);
    }
    Config.set("commandPalette:recent", recentCommands);
  }

  static removeRecentCommand(id: Command["id"]) {
    let recentCommands = CommandPaletteUtils.recentCommands();
    const index = recentCommands.findIndex((c) => c.id === id);
    if (index > -1) {
      recentCommands.splice(index, 1);
      Config.set("commandPalette:recent", recentCommands);
    }
  }

  static getCommandAction({
    id,
    type
  }: {
    id: Command["id"];
    type: Command["type"];
  }) {
    switch (type) {
      case "command":
        return CommandActionMap.get(id);
      case "note":
        return (noteId: string) =>
          useEditorStore.getState().openSession(noteId);
      case "notebook":
        return (notebookId: string) => navigate(`/notebooks/${notebookId}`);
      case "tag":
        return (tagId: string) => navigate(`/tags/${tagId}`);
      case "reminder":
        return (reminderId: string) =>
          hashNavigate(`/reminders/${reminderId}/edit`);
      default:
        return undefined;
    }
  }

  static getCommandIcon({
    id,
    type
  }: {
    id: Command["id"];
    type: Command["type"];
  }) {
    switch (type) {
      case "command":
        return CommandIconMap.get(id);
      case "note":
        return NoteIcon;
      case "notebook":
        return NotebookIcon;
      case "tag":
        return TagIcon;
      case "reminder":
        return ReminderIcon;
      default:
        return undefined;
    }
  }

  static search(query: string) {
    if (CommandPaletteUtils.isCommandMode(query)) {
      return CommandPaletteUtils.commandSearch(query);
    }
    if (query.length < 1) {
      const sessions = useEditorStore.getState().get().sessions;
      return sessions
        .filter((s) => s.type !== "new")
        .map((session) => {
          return {
            id: session.id,
            title: session.note.title,
            group: "note",
            type: "note" as const
          };
        });
    }
    return CommandPaletteUtils.dbSearch(query);
  }

  private static commandSearch(query: string) {
    const commands = CommandPaletteUtils.defaultCommands();
    const str = query.substring(1).trim();
    if (str === "") return commands;
    return commands.filter((c) => db.lookup.fuzzy(str, c.title).match);
  }

  private static async dbSearch(query: string) {
    const notes = db.lookup.noteTitles(query);
    const notebooks = db.lookup.notebooks(query, {
      titleOnly: true
    });
    const tags = db.lookup.tags(query);
    const reminders = db.lookup.reminders(query, {
      titleOnly: true
    });
    const list = (
      await Promise.all([
        notes.items(),
        notebooks.items(),
        tags.items(),
        reminders.items()
      ])
    ).flat();
    const commands = list.map((item) => {
      return {
        id: item.id,
        title: item.title,
        group: item.type,
        type: item.type
      };
    });
    return commands;
  }

  private static recentCommands() {
    return Config.get<Command[]>("commandPalette:recent", []);
  }

  private static isCommandMode = (query: string) => {
    return query.startsWith(">");
  };
}
