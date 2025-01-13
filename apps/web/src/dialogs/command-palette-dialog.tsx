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
import { Button, Flex } from "@theme-ui/components";
import { useEffect, useRef, useState } from "react";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { ArrowTopRight, Plus, Radar } from "../components/icons";
import { hashNavigate, navigate } from "../navigation";
import { useEditorStore } from "../stores/editor-store";
import { useStore as useThemeStore } from "../stores/theme-store";
import { CreateColorDialog } from "./create-color-dialog";

const commands = [
  {
    title: "Go to notes",
    icon: ArrowTopRight,
    action: () => navigate("/")
  },
  {
    title: "Go to notebooks",
    icon: ArrowTopRight,
    action: () => navigate("/notebooks")
  },
  {
    title: "Go to tags",
    icon: ArrowTopRight,
    action: () => navigate("/tags")
  },
  {
    title: "Go to favorites",
    icon: ArrowTopRight,
    action: () => navigate("/favorites")
  },
  {
    title: "Go to reminders",
    icon: ArrowTopRight,
    action: () => navigate("/reminders")
  },
  {
    title: "Go to monographs",
    icon: ArrowTopRight,
    action: () => navigate("/monographs")
  },
  {
    title: "Go to trash",
    icon: ArrowTopRight,
    action: () => navigate("/trash")
  },
  {
    title: "Go to settings",
    icon: ArrowTopRight,
    action: () => hashNavigate("/settings", { replace: true })
  },
  {
    title: "Go to help",
    icon: ArrowTopRight,
    action: () => (window.location.href = "https://help.notesnook.com")
  },
  {
    title: "New note",
    icon: Plus,
    action: () => useEditorStore.getState().newSession()
  },
  {
    title: "New notebook",
    icon: Plus,
    action: () => hashNavigate("/notebooks/create", { replace: true })
  },
  {
    title: "New tag",
    icon: Plus,
    action: () => hashNavigate("/tags/create", { replace: true })
  },
  {
    title: "New reminder",
    icon: Plus,
    action: () => hashNavigate(`/reminders/create`, { replace: true })
  },
  {
    title: "New color",
    icon: Plus,
    action: () => CreateColorDialog.show(true)
  },
  {
    title: "Toggle theme",
    icon: Radar,
    action: () => useThemeStore.getState().toggleColorScheme()
  }
];

export const CommandPaletteDialog = DialogManager.register(
  function CommandPaletteDialog(props: BaseDialogProps<boolean>) {
    const [filteredCommands, setFilteredCommands] = useState(commands);
    const [selected, setSelected] = useState<number>(0);
    const selectedRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
      selectedRef.current?.scrollIntoView({
        block: "nearest"
      });
    }, [selected]);

    return (
      <Dialog
        isOpen={true}
        width={650}
        onClose={() => props.onClose(false)}
        noScroll
        sx={{
          fontFamily: "body"
        }}
      >
        <Flex
          variant="columnFill"
          sx={{ mx: 3, overflow: "hidden", height: 450 }}
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
              placeholder={"Type here..."}
              sx={{ mx: 0, my: 2 }}
              onChange={async (e) => {
                setSelected(0);
                const query = e.target.value.trim().toLowerCase();
                if (!query) {
                  setFilteredCommands(commands);
                } else {
                  setFilteredCommands(
                    commands.filter((command) =>
                      command.title.toLowerCase().includes(query)
                    )
                  );
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
                {filteredCommands.map((command, index) => (
                  <Button
                    ref={index === selected ? selectedRef : null}
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
                      mx: 1,
                      py: 1,
                      bg: index === selected ? "hover" : "transparent"
                    }}
                  >
                    <command.icon
                      size={18}
                      color={index === selected ? "icon-selected" : "icon"}
                    />
                    {command.title}
                  </Button>
                ))}
              </Flex>
            </ScrollContainer>
          </>
        </Flex>
      </Dialog>
    );
  }
);
