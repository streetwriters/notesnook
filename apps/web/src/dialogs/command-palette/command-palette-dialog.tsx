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

import { debounce, usePromise } from "@notesnook/common";
import { EVENTS, fuzzy, Note, Notebook, Reminder, Tag } from "@notesnook/core";
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  GroupedVirtuoso,
  GroupedVirtuosoHandle,
  CalculateViewLocation
} from "react-virtuoso";
import { db } from "../../common/db";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";
import { Cross } from "../../components/icons";
import { CustomScrollbarsVirtualList } from "../../components/list-container";
import { useEditorStore } from "../../stores/editor-store";
import { strings } from "@notesnook/intl";
import { isMac } from "../../utils/platform";
import {
  getDefaultCommands,
  Command,
  getRecentCommands,
  resolveRecentCommand,
  commandActions,
  commandIcons,
  removeRecentCommand,
  addRecentCommand
} from "./commands";

type CommandPaletteDialogProps = BaseDialogProps<boolean> & {
  isCommandMode: boolean;
};

const COMMAND_PALETTE_STICKY_HEADER_HEIGHT = 32;

export const CommandPaletteDialog = DialogManager.register(
  function CommandPaletteDialog(props: CommandPaletteDialogProps) {
    const [selected, setSelected] = useState<number>(0);
    const [query, setQuery] = useState<string>("");
    const virtuosoRef = useRef<GroupedVirtuosoHandle>(null);
    const { search: dbSearch } = useDatabaseFuzzySearch();
    const defaultCommands = useRef<Command[]>();

    const select = useCallback((index: number) => {
      setSelected(index);
      virtuosoRef.current?.scrollIntoView({
        index: index,
        calculateViewLocation: calculateCommandItemLocation
      });
    }, []);

    const commands = usePromise(async () => {
      select(0);
      if (!defaultCommands.current)
        defaultCommands.current = await getDefaultCommands();
      const commands = props.isCommandMode
        ? sortCommands(commandSearch(query, defaultCommands.current))
        : await dbSearch(query);
      const groups = commands.reduce(
        (acc, command) => {
          const index = acc.keys.indexOf(command.group);
          if (index === -1) {
            acc.keys.push(command.group);
            acc.counts.push(1);
          } else {
            acc.counts[index]++;
          }
          return acc;
        },
        { counts: [], keys: [] } as {
          counts: number[];
          keys: string[];
        }
      );
      return { commands, groups };
    }, [dbSearch, query]);

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
        <Flex
          variant="columnFill"
          sx={{
            overflow: "hidden",
            height: 400,
            '[data-viewport-type="element"]': {
              width: "calc(100% - 10px) !important",
              px: 1
            }
          }}
          onKeyDown={(e) => {
            if (commands.status !== "fulfilled") return;
            if (e.key === "Delete") {
              e.preventDefault();
              const command = commands.value.commands[selected];
              if (!command) return;
              if (command.group !== "recent") return;
              removeRecentCommand(command.id);
              getDefaultCommands().then((resolved) => {
                defaultCommands.current = resolved;
                commands.refresh();
              });
              return;
            }
            if (e.key == "Enter") {
              e.preventDefault();
              const command = commands.value.commands[selected];
              if (!command) return;
              command.action?.(command, {
                openInNewTab: e.ctrlKey || e.metaKey
              });
              addRecentCommand(command);
              props.onClose(false);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              select(getNextCommandIndex(selected, commands.value.commands));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              select(
                getPreviousCommandIndex(selected, commands.value.commands)
              );
            }
          }}
        >
          <Input
            autoFocus
            variant="clean"
            placeholder={
              props.isCommandMode
                ? strings.executeACommand()
                : strings.searchForNotesNotebooksAndTags()
            }
            sx={{
              m: 0,
              marginTop: 0,
              mr: 0,
              px: 2,
              borderRadius: 0,
              borderBottom: "1px solid var(--border)"
            }}
            onChange={debounce((e) => {
              setQuery(e.target.value);
            }, 100)}
          />
          <GroupedVirtuoso
            ref={virtuosoRef}
            components={{
              Scroller: CustomScrollbarsVirtualList,
              Footer: () => (
                <div
                  className="footer"
                  style={{
                    height: "5px"
                  }}
                />
              ),
              EmptyPlaceholder: () => (
                <Text
                  sx={{
                    px: 1
                  }}
                  variant="subBody"
                >
                  {query ? strings.noResultsFound(query) : ""}
                </Text>
              ),
              TopItemList: ({ style, ...props }) => (
                <div
                  className="top-item-list"
                  {...props}
                  style={{
                    ...style,
                    width: "calc(100% - 10px) !important",
                    padding: "0px 5px"
                  }}
                />
              )
            }}
            groupCounts={
              commands.status === "fulfilled"
                ? commands.value.groups.counts
                : []
            }
            groupContent={(groupIndex) => {
              if (commands.status !== "fulfilled") return null;
              const label =
                commands.value.groups.keys[groupIndex] === "recent"
                  ? strings.recents()
                  : commands.value.groups.keys[groupIndex];

              return (
                <Box
                  sx={{
                    width: "100%",
                    py: 1,
                    bg: "background",
                    px: 1
                  }}
                >
                  <Text
                    variant="subBody"
                    dangerouslySetInnerHTML={{ __html: label }}
                  />
                </Box>
              );
            }}
            itemContent={(index) => {
              if (commands.status !== "fulfilled") return null;

              const command = commands.value.commands[index];
              if (!command) return null;

              return (
                <Flex
                  key={index}
                  onClick={(e) => {
                    command.action?.(command, {
                      openInNewTab: e.ctrlKey || e.metaKey
                    });
                    addRecentCommand(command);
                    props.onClose(false);
                  }}
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1,
                    px: 1,
                    borderRadius: "default",
                    bg:
                      index === selected
                        ? "background-selected"
                        : "transparent",
                    ":hover:not(:disabled):not(:active)": {
                      bg: index === selected ? "hover-selected" : "hover"
                    }
                  }}
                >
                  <Flex
                    sx={{
                      gap: 1
                    }}
                  >
                    {command.icon && (
                      <command.icon
                        size={14}
                        color={index === selected ? "icon-selected" : "icon"}
                      />
                    )}
                    <Text
                      variant="body"
                      sx={{
                        textOverflow: "ellipsis",
                        overflow: "hidden"
                      }}
                      dangerouslySetInnerHTML={{
                        __html: command.title
                      }}
                    />
                  </Flex>
                  {command.group === "recent" && (
                    <Button
                      title={strings.removeFromRecents()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        removeRecentCommand(command.id);
                        defaultCommands.current = await getDefaultCommands();
                        commands.refresh();
                      }}
                      variant="secondary"
                      sx={{
                        bg: "transparent",
                        p: "small",
                        borderRadius: 100
                      }}
                    >
                      <Cross size={12} />
                    </Button>
                  )}
                </Flex>
              );
            }}
          />
        </Flex>
        <Flex
          sx={{
            flexDirection: "row",
            bg: "background-secondary",
            px: 2,
            py: 2,
            gap: 3,
            borderTop: "1px solid var(--border)",
            justifyContent: "end",
            alignItems: "center"
          }}
        >
          {getCommandPaletteHelp(props.isCommandMode).map((key) => {
            return (
              <Flex
                key={key.key}
                sx={{
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1
                }}
              >
                <Text variant="body">{key.description}</Text>
                <Text variant="subBody">{key.key}</Text>
              </Flex>
            );
          })}
        </Flex>
      </Dialog>
    );
  }
);

function getNextCommandIndex(selected: number, commands: Command[]) {
  return (selected + 1) % commands.length;
}

function getPreviousCommandIndex(selected: number, commands: Command[]) {
  return (selected - 1 + commands.length) % commands.length;
}

const RESULT_PREFIX_SUFFIX = {
  prefix: "<b style='color: var(--accent-foreground)'>",
  suffix: "</b>"
};
function commandSearch(query: string, commands: Command[]) {
  if (!query) return commands;
  return fuzzy(
    query,
    commands,
    (command) => command.id + command.group,
    {
      title: 10,
      group: 5
    },
    RESULT_PREFIX_SUFFIX
  );
}

function useDatabaseFuzzySearch() {
  const notes = useRef<Note[]>();
  const notebooks = useRef<Notebook[]>();
  const tags = useRef<Tag[]>();
  const reminders = useRef<Reminder[]>();

  const updateCollections = useCallback(async (force = false) => {
    if (force || !notes.current)
      notes.current = await db.notes.all
        .fields(["notes.id", "notes.title"])
        .items();
    if (force || !notebooks.current)
      notebooks.current = await db.notebooks.all
        .fields(["notebooks.id", "notebooks.title"])
        .items();
    if (force || !tags.current)
      tags.current = await db.tags.all
        .fields(["tags.id", "tags.title"])
        .items();
    if (force || !reminders.current)
      reminders.current = await db.reminders.all
        .fields(["reminders.id", "reminders.title"])
        .items();
  }, []);

  useEffect(() => {
    const event = db.eventManager.subscribe(EVENTS.syncCompleted, async () => {
      await updateCollections(true);
    });
    return () => {
      event.unsubscribe();
      reminders.current = undefined;
      notebooks.current = undefined;
      tags.current = undefined;
      notes.current = undefined;
    };
  }, [updateCollections]);

  const search = useCallback(
    async (query: string) => {
      if (!query) return await getSessionsAsCommands();

      await updateCollections();

      const list: Command[] = [];
      const collections: Record<
        "note" | "notebook" | "tag" | "reminder",
        { id: string; title: string }[] | undefined
      > = {
        note: notes.current,
        notebook: notebooks.current,
        tag: tags.current,
        reminder: reminders.current
      };
      for (const _type in collections) {
        const type = _type as keyof typeof collections;
        const items = collections[type];
        if (!items) continue;
        for (const item of fuzzy(
          query,
          items,
          (item) => item.id,
          {
            title: 10
          },
          RESULT_PREFIX_SUFFIX
        )) {
          list.push({
            id: item.id,
            title: item.title,
            group: strings.dataTypesPluralCamelCase[type](),
            type: type,
            action: commandActions[type],
            icon: commandIcons[type]
          });
        }
      }
      return list;
    },
    [updateCollections]
  );

  return { search };
}

async function getSessionsAsCommands() {
  const commands: Command[] = [];
  for (const recentCommand of getRecentCommands()) {
    if (recentCommand.type === "command") continue;

    const resolvedCommand = await resolveRecentCommand(recentCommand);
    if (resolvedCommand) commands.push(resolvedCommand);
  }

  const sessions = useEditorStore.getState().get().sessions;
  for (const session of sessions) {
    if (
      session.type === "new" ||
      commands.find((c) => c.id === session.note.id)
    )
      continue;

    commands.push({
      id: session.note.id,
      title: session.note.title,
      group: strings.dataTypesPluralCamelCase.note(),
      type: "note" as const,
      action: commandActions.note,
      icon: commandIcons.note
    });
  }

  return commands;
}

/**
 * This override is required to ensure smooth scrolling when moving between
 * command palette items using the keyboard. Without this the selected item
 * is not visible when moving up/down in the command palette.
 */
const calculateCommandItemLocation: CalculateViewLocation = ({
  itemTop,
  itemBottom,
  viewportTop,
  viewportBottom,
  locationParams: { behavior, align, ...rest }
}) => {
  const topOffset = viewportTop + COMMAND_PALETTE_STICKY_HEADER_HEIGHT;
  const itemInView = itemTop >= topOffset && itemBottom <= viewportBottom;
  if (itemInView) return null;
  return {
    ...rest,
    offset:
      itemBottom > viewportBottom
        ? itemBottom - viewportBottom
        : itemTop - topOffset,
    behavior,
    align:
      align ??
      (itemBottom > viewportBottom
        ? "end"
        : itemTop < topOffset
        ? "start"
        : "center")
  };
};

function getCommandPaletteHelp(isCommandMode: boolean) {
  return [
    {
      key: "⏎",
      description: isCommandMode ? strings.execute() : strings.open()
    },
    ...(isCommandMode
      ? [
          {
            key: isMac() ? "⌘P" : "Ctrl+P",
            description: strings.quickOpen()
          }
        ]
      : [
          {
            key: isMac() ? "⌘⏎" : "Ctrl+⏎",
            description: strings.openInNewTab()
          },
          {
            key: isMac() ? "⌘K" : "Ctrl+K",
            description: strings.commandPalette()
          }
        ])
  ];
}

/**
 * commands need to be sorted wrt groups,
 * meaning commands of same group should be next to each other,
 * and recent commands should be at the top
 */
function sortCommands(commands: Command[]) {
  const recent: Command[] = [];
  const sortedWrtGroups: Command[][] = [];
  for (const command of commands) {
    const group = command.group;
    if (group === "recent") {
      recent.push(command);
      continue;
    }
    const index = sortedWrtGroups.findIndex((c) => c[0].group === group);
    if (index === -1) {
      sortedWrtGroups.push([command]);
    } else {
      sortedWrtGroups[index].push(command);
    }
  }
  return recent.concat(sortedWrtGroups.flat());
}
