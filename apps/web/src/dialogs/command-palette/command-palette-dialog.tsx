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
import { ScrollContainer } from "@notesnook/ui";
import { Button, Flex, Text } from "@theme-ui/components";
import { useEffect, useRef, useState } from "react";
import { db } from "../../common/db";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";
import Field from "../../components/field";
import { Cross, Icon } from "../../components/icons";
import { type Command, CommandPaletteUtils } from "./command-palette-utils";

type GroupedCommands = Record<
  string,
  (Command & { index: number; icon: Icon | undefined })[]
>;

export const CommandPaletteDialog = DialogManager.register(
  function CommandPaletteDialog(props: BaseDialogProps<boolean>) {
    const [commands, setCommands] = useState<Command[]>(
      CommandPaletteUtils.defaultCommands()
    );
    const [selected, setSelected] = useState(0);
    const [query, setQuery] = useState(">");
    const selectedRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      selectedRef.current?.scrollIntoView({
        block: "nearest"
      });
    }, [selected]);

    function searchWithoutDebounce(query: string) {
      const res = CommandPaletteUtils.search(query);
      if (res instanceof Promise) {
      } else {
        setCommands(res ?? []);
      }
    }

    async function searchWithDebounce(query: string) {
      const res = CommandPaletteUtils.search(query);
      if (res instanceof Promise) {
        const commands = await res;
        setCommands(commands ?? []);
        return;
      } else {
        setCommands(res ?? []);
      }
    }

    function reset() {
      setSelected(0);
      setQuery(">");
      setCommands(CommandPaletteUtils.defaultCommands());
    }

    const grouped = commands.reduce((acc, command, index) => {
      if (!acc[command.group]) {
        acc[command.group] = [];
      }
      acc[command.group].push({
        ...command,
        icon: CommandPaletteUtils.getCommandIcon(command),
        index
      });
      return acc;
    }, {} as GroupedCommands);

    return (
      <Dialog
        isOpen={true}
        width={650}
        onClose={() => {
          reset();
          props.onClose(false);
        }}
        noScroll
        sx={{
          fontFamily: "body"
        }}
      >
        <Flex
          variant="columnFill"
          sx={{ mx: 3, overflow: "hidden", height: 350 }}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              const command = commands[selected];
              if (!command) return;
              const action = CommandPaletteUtils.getCommandAction({
                id: command.id,
                type: command.type
              });
              if (action) {
                action(command.id);
                CommandPaletteUtils.addRecentCommand(command);
                reset();
                props.onClose(false);
              }
              setSelected(0);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected((selected + 1) % commands.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((selected - 1 + commands.length) % commands.length);
            }
          }}
        >
          <>
            <Field
              autoFocus
              placeholder={"Search in notes, notebooks, and tags"}
              sx={{ mx: 0, my: 2 }}
              defaultValue={query}
              onChange={
                query.startsWith(">") || query.trim().length < 1
                  ? (e) => {
                      setSelected(0);
                      const query = e.target.value;
                      setQuery(query);
                      searchWithoutDebounce(query);
                    }
                  : debounce((e) => {
                      setSelected(0);
                      const query = e.target.value;
                      setQuery(query);
                      searchWithDebounce(query);
                    }, 500)
              }
            />
            <ScrollContainer>
              <Flex
                sx={{
                  flexDirection: "column",
                  gap: 1,
                  mt: 2,
                  mb: 4
                }}
              >
                {Object.entries(grouped).map(([group, commands]) => (
                  <Flex
                    key={group}
                    sx={{ flexDirection: "column", gap: 1, mx: 1 }}
                  >
                    <Text variant="subBody">{toTitleCase(group)}</Text>
                    <Flex
                      sx={{
                        flexDirection: "column",
                        gap: 1
                      }}
                    >
                      {commands.map((command, index) => (
                        <Flex
                          sx={{
                            flexDirection: "row",
                            gap: 1,
                            alignItems: "center"
                          }}
                        >
                          <Button
                            title={command.title}
                            ref={
                              command.index === selected ? selectedRef : null
                            }
                            key={index}
                            onClick={() => {
                              const action =
                                CommandPaletteUtils.getCommandAction({
                                  id: command.id,
                                  type: command.type
                                });
                              if (action) {
                                action(command.id);
                                CommandPaletteUtils.addRecentCommand(command);
                                reset();
                                props.onClose(false);
                              }
                            }}
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              width: "100%",
                              gap: 2,
                              py: 1,
                              bg:
                                command.index === selected
                                  ? "hover"
                                  : "transparent",
                              ".chip": {
                                bg:
                                  command.index === selected
                                    ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                                    : "var(--background-secondary)"
                              },
                              ":hover:not(:disabled):not(:active)": {
                                bg: "hover"
                              }
                            }}
                          >
                            {command.icon && (
                              <command.icon
                                size={18}
                                color={
                                  command.index === selected
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
                                  borderColor: "border"
                                }}
                              >
                                <Highlighter
                                  text={command.title}
                                  query={query}
                                />
                              </Text>
                            ) : (
                              <Highlighter text={command.title} query={query} />
                            )}
                          </Button>
                          {command.group === "recent" && (
                            <Button
                              title="Remove from recent"
                              onClick={(e) => {
                                e.stopPropagation();
                                CommandPaletteUtils.removeRecentCommand(
                                  command.id
                                );
                                setCommands(
                                  CommandPaletteUtils.defaultCommands()
                                );
                              }}
                              variant="icon"
                              sx={{
                                p: 1,
                                mr: 1
                              }}
                            >
                              <Cross size={14} />
                            </Button>
                          )}
                        </Flex>
                      ))}
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            </ScrollContainer>
          </>
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

function Highlighter({ text, query }: { text: string; query: string }) {
  const queryClean = query.startsWith(">")
    ? query.slice(1).trim()
    : query.trim();
  const result =
    queryClean.length > 0
      ? db.lookup.fuzzy(queryClean, text, {
          prefix: "<b style='color: var(--accent-foreground)'>",
          suffix: "</b>"
        })
      : text;

  return (
    <span
      dangerouslySetInnerHTML={{
        __html: typeof result === "string" ? result : text
      }}
    />
  );
}
