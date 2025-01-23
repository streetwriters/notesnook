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

import { ScrollContainer } from "@notesnook/ui";
import { Button, Flex, Text } from "@theme-ui/components";
import { Fragment, useEffect, useRef, useState } from "react";
import { db } from "../../common/db";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";
import Field from "../../components/field";
import {
  Icon,
  Note as NoteIcon,
  Notebook as NotebookIcon,
  Reminder as ReminderIcon,
  Tag as TagIcon
} from "../../components/icons";
import { hashNavigate, navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import { commands } from "./commands";
import Config from "../../utils/config";

enum Mode {
  COMMAND,
  SEARCH
}

type Command = {
  title: string;
  icon: Icon;
  action: () => void;
  group: string;
  renderAsChip?: boolean;
};

const searchMap = new Map<string, Command[]>();

export const CommandPaletteDialog = DialogManager.register(
  function CommandPaletteDialog(props: BaseDialogProps<boolean>) {
    const [filteredCommands, setFilteredCommands] =
      useState<Command[]>(commands);
    const [mode, setMode] = useState(Mode.COMMAND);
    const [value, setValue] = useState(">");
    const [selected, setSelected] = useState<number>(0);
    const selectedRef = useRef<HTMLButtonElement>(null);
    const { sessions } = useEditorStore();

    useEffect(() => {
      selectedRef.current?.scrollIntoView({
        block: "nearest"
      });
    }, [selected]);

    useEffect(() => {
      if (mode === Mode.COMMAND || value === "") return;

      let isLatest = true;

      (async () => {
        if (searchMap.has(value)) {
          setFilteredCommands(searchMap.get(value) ?? []);
          return;
        }
        const results = await search(value);
        if (!isLatest) return;
        setFilteredCommands(results ?? []);
      })();
      return () => {
        isLatest = false;
      };
    }, [value]);

    const grouped = filteredCommands.reduce((acc, command, index) => {
      if (!acc[command.group]) {
        acc[command.group] = [];
      }
      acc[command.group].push({
        ...command,
        index
      });
      return acc;
    }, {} as Record<string, (Command & { index: number })[]>);

    async function search(query: string) {
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

      const commands = list.map((item) => ({
        title: item.title,
        renderAsChip: true,
        icon:
          item.type === "note"
            ? NoteIcon
            : item.type === "notebook"
            ? NotebookIcon
            : item.type === "tag"
            ? TagIcon
            : ReminderIcon,
        action: () => {
          if (item.type === "note") {
            useEditorStore.getState().openSession(item.id);
            return;
          }
          if (item.type === "notebook") {
            navigate(`/notebooks/${item.id}`);
            return;
          }
          if (item.type === "tag") {
            navigate(`/tags/${item.id}`);
            return;
          }
          if (item.type === "reminder") {
            hashNavigate(`/reminders/${item.id}/edit`);
            return;
          }
        },
        group:
          item.type.substring(0, 1).toUpperCase() + item.type.substring(1) + "s"
      }));

      searchMap.set(query, commands);
      return commands;
    }

    return (
      <Dialog
        isOpen={true}
        width={650}
        onClose={() => {
          searchMap.clear();
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
              if (filteredCommands[selected]) {
                filteredCommands[selected].action();
                setFilteredCommands(commands);
                setSelected(0);
                props.onClose(true);
              } else {
                setSelected(0);
              }
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSelected(
                (selected) => (selected + 1) % filteredCommands.length
              );
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSelected(
                (selected) =>
                  (selected - 1 + filteredCommands.length) %
                  filteredCommands.length
              );
            }
          }}
        >
          <>
            <Field
              autoFocus
              placeholder={"Search in notes, notebooks, and tags"}
              sx={{ mx: 0, my: 2 }}
              value={value}
              onChange={async (e) => {
                setSelected(0);
                setValue(e.target.value);
                if (e.target.value.startsWith(">")) {
                  setMode(Mode.COMMAND);
                  setFilteredCommands(commands);
                } else {
                  setMode(Mode.SEARCH);
                  // setFilteredCommands([]);
                }

                const query = e.target.value.trim().toLowerCase();

                if (!query || query.length === 0) {
                  setFilteredCommands(
                    e.target.value.startsWith(">")
                      ? commands
                      : sessions
                          .filter((s) => s.type !== "new")
                          .map((s) => ({
                            title: s.note.title,
                            renderAsChip: true,
                            icon: NoteIcon,
                            action: () => {
                              useEditorStore.getState().openSession(s.id);
                            },
                            group: "Notes"
                          }))
                  );
                  return;
                }

                if (
                  e.target.value.startsWith(">") &&
                  e.target.value.length >= 1
                ) {
                  const matches = db.lookup.fuzzy(
                    query.substring(1),
                    commands.map((c) => c.title)
                  );
                  const matchedCommands = matches
                    .map((match) => {
                      return commands.find((c) => c.title === match);
                    })
                    .filter((c) => c !== undefined);
                  setFilteredCommands(matchedCommands);
                  return;
                }
              }}
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
                  <Flex sx={{ flexDirection: "column", gap: 1, mx: 1 }}>
                    <Text variant="subBody">{group}</Text>
                    <Flex
                      sx={{
                        flexDirection: "column",
                        gap: 1
                      }}
                    >
                      {commands.map((command, index) => (
                        <Button
                          ref={command.index === selected ? selectedRef : null}
                          key={index}
                          onClick={() => {
                            command.action();
                            props.onClose(true);
                          }}
                          sx={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
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
                          <command.icon
                            size={18}
                            color={
                              command.index === selected
                                ? "icon-selected"
                                : "icon"
                            }
                          />
                          {command.renderAsChip ? (
                            <Text
                              className="chip"
                              sx={{
                                px: 1,
                                borderRadius: "4px",
                                border: "1px solid",
                                borderColor: "border"
                              }}
                            >
                              <Highlighter text={command.title} query={value} />
                            </Text>
                          ) : (
                            <Highlighter text={command.title} query={value} />
                          )}
                        </Button>
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
  const indices = getMatchingIndices(text, query);

  if (indices.length === 0) {
    return <>{text}</>;
  }

  return (
    <span>
      {indices.map((index, i) => (
        <Fragment key={i}>
          {text.substring(i === 0 ? 0 : indices[i - 1] + 1, index)}
          <b style={{ color: "var(--accent-foreground)" }}>{text[index]}</b>
        </Fragment>
      ))}
      {text.substring(indices[indices.length - 1] + 1)}
    </span>
  );
}

function getMatchingIndices(text: string, query: string) {
  const indices: number[] = [];
  const set = new Set(query.toLowerCase());
  const lowerText = text.toLowerCase();

  for (let i = 0; i < lowerText.length; i++) {
    if (set.has(lowerText[i])) {
      indices.push(i);
    }
  }

  return indices;
}
