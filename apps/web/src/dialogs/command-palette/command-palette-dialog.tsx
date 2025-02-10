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

import { debounce, toTitleCase } from "@notesnook/common";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { GroupedVirtuoso, GroupedVirtuosoHandle } from "react-virtuoso";
import { db } from "../../common/db";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";
import Field from "../../components/field";
import {
  Cross,
  Icon,
  Notebook as NotebookIcon,
  Note as NoteIcon,
  Reminder as ReminderIcon,
  Tag as TagIcon
} from "../../components/icons";
import { CustomScrollbarsVirtualList } from "../../components/list-container";
import { hashNavigate, navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import Config from "../../utils/config";
import { commands as COMMANDS } from "./commands";

interface Command {
  id: string;
  title: string;
  highlightedTitle?: string;
  type:
    | "command"
    | "command-dynamic"
    | "note"
    | "notebook"
    | "tag"
    | "reminder";
  group: string;
}

type GroupedCommands = { group: string; count: number }[];

type CommandPaletteDialogProps = BaseDialogProps<boolean> & {
  isCommandMode: boolean;
};

export const CommandPaletteDialog = DialogManager.register(
  function CommandPaletteDialog(props: CommandPaletteDialogProps) {
    const [commands, setCommands] = useState<Command[]>(
      props.isCommandMode ? getDefaultCommands() : getSessionsAsCommands()
    );
    const [selected, setSelected] = useState({ x: 0, y: 0 });
    const [query, setQuery] = useState(props.isCommandMode ? ">" : "");
    const [loading, setLoading] = useState(false);
    const virtuosoRef = useRef<GroupedVirtuosoHandle>(null);

    useEffect(() => {
      virtuosoRef.current?.scrollToIndex({
        index: selected.y,
        align: "end",
        behavior: "auto"
      });
    }, [selected]);

    const onChange = useCallback(async function onChange(
      e: React.ChangeEvent<HTMLInputElement>
    ) {
      try {
        setSelected({ x: 0, y: 0 });
        const query = e.target.value;
        setQuery(query);
        if (!isCommandMode(query)) {
          setLoading(true);
        }
        const res = await search(query);
        const highlighted = db.lookup.fuzzy(
          prepareQuery(query),
          res.map((r) => ({
            ...r,
            highlightedTitle: r.title
          })) ?? [],
          /**
           * we use a separate key for highlighted title
           * so that when we save recent commands to local storage
           * we can save the original title instead of the highlighted one
           */
          "highlightedTitle",
          {
            prefix: "<b style='color: var(--accent-foreground)'>",
            suffix: "</b>"
          }
        );
        setCommands(highlighted ?? []);
      } finally {
        setLoading(false);
      }
    },
    []);

    const grouped = useMemo(
      () =>
        commands.reduce((acc, command) => {
          const item = acc.find((c) => c.group === command.group);
          if (item) {
            item.count++;
          } else {
            acc.push({ group: command.group, count: 1 });
          }
          return acc;
        }, [] as GroupedCommands),
      [commands]
    );

    return (
      <Dialog
        isOpen={true}
        width={650}
        onClose={() => {
          props.onClose(false);
        }}
        noScroll
        sx={{
          fontFamily: "body"
        }}
      >
        <Box
          className="ping"
          sx={{
            height: 4,
            bg: loading ? "accent" : "background",
            transition: "background 0.2s"
          }}
        />
        <Flex
          variant="columnFill"
          sx={{ mx: 3, overflow: "hidden", height: 400 }}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              const command = commands[selected.y];
              if (!command) return;
              if (selected.x === 1) {
                setSelected({ x: 0, y: 0 });
                removeRecentCommand(command.id);
                setCommands((commands) =>
                  commands.filter((c) => c.id !== command.id)
                );
                return;
              }
              const action = getCommandAction({
                id: command.id,
                type: command.type
              });
              action?.(command.id);
              addRecentCommand(command);
              props.onClose(false);
              setSelected({ x: 0, y: 0 });
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected(arrowNavigate.down(selected, commands));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected(arrowNavigate.up(selected, commands));
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              setSelected(arrowNavigate.right(selected, commands));
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setSelected(arrowNavigate.left(selected, commands));
            }
          }}
        >
          <Field
            autoFocus
            placeholder={"Search in notes, notebooks, and tags"}
            sx={{ mx: 0, my: 2 }}
            defaultValue={query}
            onChange={isCommandMode(query) ? onChange : debounce(onChange, 500)}
          />
          {query && commands.length === 0 && (
            <Box>
              <Text variant="subBody">No results found</Text>
            </Box>
          )}
          <Box sx={{ marginY: "10px", height: "100%" }}>
            <GroupedVirtuoso
              ref={virtuosoRef}
              style={{ overflow: "hidden" }}
              components={{
                Scroller: CustomScrollbarsVirtualList
              }}
              groupCounts={grouped.map((g) => g.count)}
              groupContent={(groupIndex) => {
                return (
                  <Box
                    sx={{
                      width: "100%",
                      py: 0.5,
                      bg: "background",
                      px: 1,
                      borderRadius: "2px"
                    }}
                  >
                    <Text variant="subBody" bg="">
                      {toTitleCase(grouped[groupIndex].group)}
                    </Text>
                  </Box>
                );
              }}
              itemContent={(index) => {
                const command = commands[index];
                if (!command) return null;

                const Icon = getCommandIcon({
                  id: command.id,
                  type: command.type
                });

                return (
                  <Flex
                    sx={{
                      flexDirection: "row",
                      gap: 1,
                      alignItems: "center"
                    }}
                  >
                    <Button
                      title={command.title}
                      key={index}
                      onClick={() => {
                        const action = getCommandAction({
                          id: command.id,
                          type: command.type
                        });
                        action?.(command.id);
                        addRecentCommand(command);
                        props.onClose(false);
                      }}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        gap: 2,
                        py: 1,
                        bg:
                          selected.x === 0 && index === selected.y
                            ? "hover"
                            : "transparent",
                        ".chip": {
                          bg:
                            selected.x === 0 && index === selected.y
                              ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                              : "var(--background-secondary)"
                        },
                        ":hover:not(:disabled):not(:active)": {
                          bg: "hover"
                        }
                      }}
                    >
                      {Icon && (
                        <Icon
                          size={18}
                          color={
                            selected.x === 0 && index === selected.y
                              ? "icon-selected"
                              : "icon"
                          }
                        />
                      )}
                      {["note", "notebook", "reminder", "tag"].includes(
                        command.type
                      ) ? (
                        <Text
                          className="chip"
                          sx={{
                            px: 1,
                            borderRadius: "4px",
                            border: "1px solid",
                            borderColor: "border",
                            textOverflow: "ellipsis",
                            overflow: "hidden"
                          }}
                          dangerouslySetInnerHTML={{
                            __html: command?.highlightedTitle ?? command.title
                          }}
                        />
                      ) : (
                        <Text
                          sx={{
                            textOverflow: "ellipsis",
                            overflow: "hidden"
                          }}
                          dangerouslySetInnerHTML={{
                            __html: command?.highlightedTitle ?? command.title
                          }}
                        />
                      )}
                    </Button>
                    {command.group === "recent" && (
                      <Button
                        title="Remove from recent"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentCommand(command.id);
                          setCommands((commands) =>
                            commands.filter((c) => c.id !== command.id)
                          );
                        }}
                        variant="icon"
                        sx={{
                          bg:
                            selected.x === 1 && index === selected.y
                              ? "hover"
                              : "transparent",
                          p: 1,
                          mr: 1,
                          ":hover:not(:disabled):not(:active)": {
                            bg: "hover"
                          }
                        }}
                      >
                        <Cross size={14} />
                      </Button>
                    )}
                  </Flex>
                );
              }}
            />
          </Box>
        </Flex>
        <Flex
          sx={{ flexDirection: "row", bg: "hover", justifyContent: "center" }}
        >
          <Text variant="subBody" sx={{ m: 0.5 }}>
            <kbd>{">"}</kbd> for command mode · remove <kbd>{">"}</kbd> for
            search mode · <kbd>⏎</kbd> to select · <kbd>↑</kbd>
            <kbd>↓</kbd> to navigate
          </Text>
        </Flex>
      </Dialog>
    );
  }
);

const arrowNavigate: Record<
  "down" | "up" | "right" | "left",
  (
    current: Record<"x" | "y", number>,
    commands: Command[]
  ) => Record<"x" | "y", number>
> = {
  down: (current, commands) => {
    const currentCommand = commands[current.y];
    const nextIndex = (current.y + 1) % commands.length;
    const nextCommand = commands[nextIndex];
    if (currentCommand.group === "recent" && nextCommand.group === "recent") {
      return { x: current.x, y: nextIndex };
    }
    return { x: 0, y: nextIndex };
  },
  up: (current, commands) => {
    const currentCommand = commands[current.y];
    const nextIndex = (current.y - 1 + commands.length) % commands.length;
    const nextCommand = commands[nextIndex];
    if (currentCommand.group === "recent" && nextCommand.group === "recent") {
      return { x: current.x, y: nextIndex };
    }
    return { x: 0, y: nextIndex };
  },
  right: (current, commands) => {
    const currentCommand = commands[current.y];
    if (currentCommand.group !== "recent") return current;
    const nextIndex = (current.x + 1) % 2;
    return { x: nextIndex, y: current.y };
  },
  left: (current, commands) => {
    const currentCommand = commands[current.y];
    if (currentCommand.group !== "recent") return current;
    const nextIndex = (current.x - 1 + 2) % 2;
    return { x: nextIndex, y: current.y };
  }
};

const CommandIconMap = COMMANDS.reduce((acc, command) => {
  acc.set(command.id, command.icon);
  return acc;
}, new Map<string, Icon>());

const CommandActionMap = COMMANDS.reduce((acc, command) => {
  acc.set(command.id, command.action);
  return acc;
}, new Map<string, (arg?: any) => void>());

function resolveCommands() {
  return COMMANDS.reduce((acc, command) => {
    // sanity check
    // command id should not be duplicated
    // need to double check the COMMANDS list
    // then remove this condition
    if (acc.find((c) => c.id === command.id)) return acc;

    const hidden = command.hidden ? command.hidden() : false;
    const group =
      typeof command.group === "function" ? command.group() : command.group;
    const title =
      typeof command.title === "function" ? command.title() : command.title;
    if (hidden || group === undefined || title === undefined) return acc;
    return acc.concat({
      id: command.id,
      title: title,
      type: command.dynamic
        ? ("command-dynamic" as const)
        : ("command" as const),
      group: group
    });
  }, [] as Command[]);
}

function getDefaultCommands() {
  return getRecentCommands().concat(resolveCommands());
}

function getRecentCommands() {
  return Config.get<Command[]>("commandPalette:recent", []);
}

function addRecentCommand(command: Command) {
  if (command.type === "command-dynamic") return;
  let commands = getRecentCommands();
  const index = commands.findIndex((c) => c.id === command.id);
  if (index > -1) {
    commands.splice(index, 1);
  }
  commands.unshift({
    ...command,
    highlightedTitle: undefined,
    group: "recent"
  });
  if (commands.length > 3) {
    commands = commands.slice(0, 3);
  }
  Config.set("commandPalette:recent", commands);
}

function removeRecentCommand(id: Command["id"]) {
  let commands = getRecentCommands();
  const index = commands.findIndex((c) => c.id === id);
  if (index > -1) {
    commands.splice(index, 1);
    Config.set("commandPalette:recent", commands);
  }
}

function getCommandAction({
  id,
  type
}: {
  id: Command["id"];
  type: Command["type"];
}) {
  switch (type) {
    case "command":
      return CommandActionMap.get(id);
    case "command-dynamic":
      return CommandActionMap.get(id);
    case "note":
      return (noteId: string) => useEditorStore.getState().openSession(noteId);
    case "notebook":
      return (notebookId: string) => navigate(`/notebooks/${notebookId}`);
    case "tag":
      return (tagId: string) => navigate(`/tags/${tagId}`);
    case "reminder":
      return (reminderId: string) =>
        hashNavigate(`/reminders/${reminderId}/edit`);
  }
}

function getCommandIcon({
  id,
  type
}: {
  id: Command["id"];
  type: Command["type"];
}) {
  switch (type) {
    case "command":
      return CommandIconMap.get(id);
    case "command-dynamic":
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

function getSessionsAsCommands() {
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

function search(query: string) {
  const prepared = prepareQuery(query);
  if (isCommandMode(query)) {
    return commandSearch(prepared);
  }
  if (prepared.length < 1) {
    return getSessionsAsCommands();
  }
  return dbSearch(prepared);
}

function commandSearch(query: string) {
  const commands = getDefaultCommands();
  return db.lookup
    .fuzzy(query, commands, "title", { matchOnly: true })
    .concat(
      query.length > 3
        ? commands.filter((command) =>
            command.group.toLowerCase().includes(query.toLowerCase())
          )
        : []
    )
    .reduce((acc, command) => {
      if (acc.find((c) => c.id === command.id)) return acc;
      return acc.concat(command);
    }, [] as Command[]);
}

async function dbSearch(query: string) {
  const notes = db.lookup.notes(query, undefined, {
    titleOnly: true
  });
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

function isCommandMode(query: string) {
  return query.startsWith(">");
}

function prepareQuery(query: string) {
  return isCommandMode(query) ? query.substring(1).trim() : query.trim();
}
