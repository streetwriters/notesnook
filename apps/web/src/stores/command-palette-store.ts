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

import BaseStore from ".";
import { db } from "../common/db";
import createStore from "../common/store";
import {
  Icon,
  Note as NoteIcon,
  Notebook as NotebookIcon,
  Reminder as ReminderIcon,
  Tag as TagIcon
} from "../components/icons";
import { commands as COMMANDS } from "../dialogs/command-palette/commands";
import { hashNavigate, navigate } from "../navigation";
import { useEditorStore } from "./editor-store";

interface Command {
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

const cache = new Map<string, Command[]>();

class CommandPaletteStore extends BaseStore<CommandPaletteStore> {
  commands: Command[] = COMMANDS.map((c) => ({
    id: c.id,
    title: c.title,
    group: c.group,
    type: "command"
  }));
  selected = 0;
  query = ">";

  setCommands = (commands: Command[]) => {
    this.set((state) => {
      state.commands = commands;
    });
  };

  setSelected = (selected: number) => {
    this.set((state) => {
      state.selected = selected;
    });
  };

  setQuery = (query: string) => {
    this.set((state) => {
      state.query = query;
    });
  };

  search = (query: string) => {
    console.log("store cache", cache);
    if (cache.has(query)) {
      console.log("store cache hit", query, cache);
      return cache.get(query);
    }
    if (this.isCommandMode(query)) {
      return this.commandSearch(query);
    } else {
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
      return this.dbSearch(query);
    }
  };

  getCommandAction = ({
    id,
    type
  }: {
    id: Command["id"];
    type: Command["type"];
  }) => {
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
  };

  getCommandIcon = ({
    id,
    type
  }: {
    id: Command["id"];
    type: Command["type"];
  }) => {
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
  };

  reset = () => {
    this.set({
      query: ">",
      selected: 0,
      commands: COMMANDS.map((c) => {
        return {
          id: c.id,
          title: c.title,
          group: c.group,
          type: "command"
        };
      })
    });
    cache.clear();
  };

  private commandSearch(query: string) {
    console.log("store command search", query, this.commands);
    const str = query.substring(1).trim();
    if (str === "") return this.commands;
    const matches = db.lookup.fuzzy(
      str,
      this.commands.map((c) => c.title)
    );
    const matchedCommands = this.commands.filter((c) =>
      matches.includes(c.title)
    );
    return matchedCommands;
  }

  private async dbSearch(query: string) {
    console.log("store db search", query);
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
    cache.set(query, commands);
    return commands;
  }

  private isCommandMode = (query: string) => {
    return query.startsWith(">");
  };
}

const [useCommandPaletteStore] = createStore<CommandPaletteStore>(
  (set, get) => new CommandPaletteStore(set, get)
);

export { useCommandPaletteStore };
