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

import {
  debounce,
  formatKey,
  keybindings,
  usePromise
} from "@notesnook/common";
import { EVENTS, fuzzy, Note, Notebook, Reminder, Tag } from "@notesnook/core";
import {
  Button,
  Dialog,
  Flex,
  Text,
  VirtualList,
  type VirtualListHandle
} from "@ui";
import { environment } from "@platform";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodeHTML, escapeUTF8 } from "entities";
import { db } from "../../common/db";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import { Close, SearchIcon } from "../../components/icons";
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
import { truncateString } from "../../common";
import { Field } from "../components/field";

type CommandPaletteDialogProps = BaseDialogProps<boolean> & {
  isCommandMode: boolean;
};

type Row =
  | { kind: "group"; label: string; key: string }
  | { kind: "command"; command: Command; index: number; key: string };

function HighlightedText(props: {
  html: string;
  selected?: boolean;
  numberOfLines?: number;
}) {
  const parts = props.html.split(/(<b>.*?<\/b>)/g).filter(Boolean);
  return (
    <Text
      variant="body"
      numberOfLines={props.numberOfLines ?? 1}
      sx={{ color: "paragraph", fontSize: "xs" }}
    >
      {parts.map((part, index) =>
        part.startsWith("<b>") ? (
          <Text
            key={index}
            sx={{
              color: "accentForeground",
              fontWeight: "bold",
              fontSize: "xs"
            }}
          >
            {decodeHTML(part.slice(3, -4))}
          </Text>
        ) : (
          decodeHTML(part)
        )
      )}
    </Text>
  );
}

export const CommandPaletteDialog = DialogManager.register(
  function CommandPaletteDialog(props: CommandPaletteDialogProps) {
    const [selected, setSelected] = useState<number>(0);
    const [query, setQuery] = useState<string>("");
    const listRef = useRef<VirtualListHandle>(null);
    const { search: dbSearch } = useDatabaseFuzzySearch();
    const defaultCommands = useRef<Command[] | undefined>(undefined);

    const commands = usePromise(async () => {
      setSelected(0);
      if (!defaultCommands.current)
        defaultCommands.current = await getDefaultCommands();
      const commands = props.isCommandMode
        ? sortCommands(commandSearch(query, defaultCommands.current))
        : await dbSearch(query);
      return { commands };
    }, [dbSearch, query]);

    const rows = useMemo<Row[]>(() => {
      if (commands.status !== "fulfilled") return [];
      const result: Row[] = [];
      let lastGroup: string | undefined;
      commands.value.commands.forEach((command, index) => {
        if (command.group !== lastGroup) {
          lastGroup = command.group;
          result.push({
            kind: "group",
            key: `group-${command.group}-${index}`,
            label:
              command.group === "recent" ? strings.recents() : command.group
          });
        }
        result.push({
          kind: "command",
          command,
          index,
          key: `${command.id}-${index}`
        });
      });
      return result;
    }, [commands]);

    const select = useCallback(
      (index: number) => {
        setSelected(index);
        const rowIndex = rows.findIndex(
          (row) => row.kind === "command" && row.index === index
        );
        if (rowIndex > -1)
          listRef.current?.scrollToIndex({ index: rowIndex, align: "center" });
      },
      [rows]
    );

    const execute = (command: Command, openInNewTab: boolean) => {
      command.action?.(command, { openInNewTab });
      addRecentCommand(command);
      props.onClose(false);
    };

    return (
      <Dialog
        isOpen={true}
        width={650}
        onClose={() => props.onClose(false)}
        noScroll
      >
        <Flex
          sx={{ flexDirection: "column", height: 500, overflow: "hidden" }}
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

              if (e.shiftKey && !props.isCommandMode) {
                useEditorStore.getState().addTab();
                if (query) {
                  const activeSessionId = useEditorStore
                    .getState()
                    .getActiveSession()?.id;
                  if (activeSessionId) {
                    useEditorStore.getState().setTitle(activeSessionId, query);
                  }
                }
                props.onClose(false);
                return;
              }

              const command = commands.value.commands[selected];
              if (!command) return;
              execute(command, e.ctrlKey || e.metaKey);
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
          <Field
            autoFocus
            variant="clean"
            placeholder={
              props.isCommandMode
                ? strings.executeACommand()
                : strings.searchForNotesNotebooksAndTags()
            }
            sx={{
              px: "spacing7",
              pb: "spacing6",
              borderBottom: "1px solid",
              borderBottomColor: "separator"
            }}
            styles={{ input: { pl: 30 } }}
            onChangeText={debounce((text: string) => {
              setQuery(text);
            }, 100)}
            leftIcon={SearchIcon}
          />
          {rows.length === 0 && commands.status === "fulfilled" ? (
            <Flex
              sx={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            >
              <Text sx={{ color: "paragraph-secondary", fontSize: "sm" }}>
                {query
                  ? strings.noResultsFound(query)
                  : strings.noRecentSearches()}
              </Text>
            </Flex>
          ) : (
            <VirtualList
              ref={listRef}
              count={rows.length}
              estimatedItemSize={32}
              itemKey={(index) => rows[index].key}
              extraData={[selected, rows]}
              sx={{ flex: 1 }}
              renderItem={(rowIndex) => {
                const row = rows[rowIndex];
                if (!row) return null;
                if (row.kind === "group")
                  return (
                    <Flex
                      sx={{
                        bg: "background",
                        px: "spacing7",
                        pt: "spacing6",
                        pb: "spacing4"
                      }}
                    >
                      <HighlightedText html={truncateString(row.label, 200)} />
                    </Flex>
                  );
                const { command, index } = row;
                return (
                  <Flex
                    onPress={(e) => execute(command, e.ctrlKey || e.metaKey)}
                    sx={{
                      cursor: "pointer",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: "spacing2",
                      px: "spacing2",
                      mx: "spacing7",
                      borderRadius: "radius1",
                      bg:
                        index === selected
                          ? "background-selected"
                          : "transparent",
                      ":hover": {
                        bg: index === selected ? "hover-selected" : "hover"
                      }
                    }}
                  >
                    <Flex
                      sx={{
                        flexDirection: "row",
                        gap: "spacing3",
                        alignItems: "center",
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      {command.icon && (
                        <Flex
                          sx={{
                            flexShrink: 0,
                            bg: "background-secondary",
                            width: 25,
                            height: 25,
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "radius1"
                          }}
                        >
                          <command.icon
                            size={13}
                            color={
                              index === selected ? "icon-selected" : "icon"
                            }
                          />
                        </Flex>
                      )}
                      <HighlightedText
                        html={
                          query
                            ? command.title
                            : truncateString(command.title, 200)
                        }
                      />
                    </Flex>
                    {command.group === "recent" && (
                      <Button
                        title={strings.removeFromRecents()}
                        onPress={async () => {
                          removeRecentCommand(command.id);
                          defaultCommands.current = await getDefaultCommands();
                          if (commands.status !== "pending") commands.refresh();
                        }}
                        variant="secondary"
                        sx={{
                          bg: "transparent",
                          borderRadius: "radius1",
                          width: 20,
                          height: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <Close size={13} />
                      </Button>
                    )}
                  </Flex>
                );
              }}
            />
          )}
        </Flex>
        <Flex
          sx={{
            flexDirection: "row",
            bg: "background-secondary",
            px: "spacing7",
            py: "spacing4",
            gap: "spacing5",
            justifyContent: "flex-end",
            alignItems: "center"
          }}
        >
          {getCommandPaletteHelp(props.isCommandMode).map((key) => {
            return (
              <Flex
                key={key.key}
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "spacing2"
                }}
              >
                <Text sx={{ color: "paragraph", fontSize: "3xs" }}>
                  {key.description}
                </Text>
                <Text sx={{ color: "paragraph-secondary", fontSize: "3xs" }}>
                  {key.key}
                </Text>
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
  prefix: "<b>",
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
  const notes = useRef<Note[] | undefined>(undefined);
  const notebooks = useRef<Notebook[] | undefined>(undefined);
  const tags = useRef<Tag[] | undefined>(undefined);
  const reminders = useRef<Reminder[] | undefined>(undefined);

  const updateCollections = useCallback(async (force = false) => {
    if (force || !notes.current)
      notes.current = (
        await db.notes.all.fields(["notes.id", "notes.title"]).items()
      ).map((n) => ({ ...n, title: escapeUTF8(n.title) }));
    if (force || !notebooks.current)
      notebooks.current = (
        await db.notebooks.all
          .fields(["notebooks.id", "notebooks.title"])
          .items()
      ).map((n) => ({ ...n, title: escapeUTF8(n.title) }));
    if (force || !tags.current)
      tags.current = (
        await db.tags.all.fields(["tags.id", "tags.title"]).items()
      ).map((t) => ({ ...t, title: escapeUTF8(t.title) }));
    if (force || !reminders.current)
      reminders.current = (
        await db.reminders.all
          .fields(["reminders.id", "reminders.title"])
          .items()
      ).map((r) => ({ ...r, title: escapeUTF8(r.title) }));
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
      const escapedQuery = escapeUTF8(query);
      for (const _type in collections) {
        const type = _type as keyof typeof collections;
        const items = collections[type];
        if (!items) continue;
        for (const item of fuzzy(
          escapedQuery,
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
      title: escapeUTF8(session.note.title),
      group: strings.dataTypesPluralCamelCase.note(),
      type: "note" as const,
      action: commandActions.note,
      icon: commandIcons.note
    });
  }

  return commands;
}

function getCommandPaletteHelp(isCommandMode: boolean) {
  return [
    {
      key: "⏎",
      description: isCommandMode ? strings.execute() : strings.open()
    },
    ...(isCommandMode
      ? [
          {
            key: keybindings.openQuickOpen
              .keys(environment.isDesktopApp)
              .map((k) => formatKey(k, isMac(), "+"))
              .join(" / "),
            description: strings.quickOpen()
          }
        ]
      : [
          {
            key: isMac() ? "⌘⏎" : "Ctrl+⏎",
            description: strings.openInNewTab()
          },
          {
            key: "Shift+⏎",
            description: strings.createNewNote()
          },
          {
            key: keybindings.openCommandPalette
              .keys(environment.isDesktopApp)
              .map((k) => formatKey(k, isMac(), "+"))
              .join(" / "),
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
