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

import { keybindings } from "@notesnook/common";
import { Flex, Text } from "@theme-ui/components";
import { DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";

const filtered = Object.values(keybindings).reduce(
  (acc, shortcut) => {
    if (shortcut.type === "tiptap") {
      acc.push({
        ...shortcut,
        keys:
          typeof shortcut.keys === "string" ? [shortcut.keys] : shortcut.keys
      });
      return acc;
    }

    if (Array.isArray(shortcut.keys)) {
      acc.push({
        ...shortcut,
        keys: shortcut.keys
      });
      return acc;
    }

    if (IS_DESKTOP_APP) {
      if (shortcut.keys.desktop) {
        acc.push({
          ...shortcut,
          keys: shortcut.keys.desktop
        });
        return acc;
      }
    } else {
      if ("web" in shortcut.keys && shortcut.keys.web) {
        acc.push({
          ...shortcut,
          keys: shortcut.keys.web
        });
        return acc;
      }
    }

    return acc;
  },
  [] as {
    keys: string[];
    description: string;
    category: string;
    type: "tiptap" | "hotkeys";
  }[]
);

function formatKey(key: string) {
  return key
    .replaceAll("+", " ")
    .replaceAll("command", "Command")
    .replace("ctrl", "Ctrl")
    .replace("shift", "Shift")
    .replace("alt", "Alt")
    .replace("Mod", "Ctrl");
}

export const KeyboardShortcutsDialog = DialogManager.register(
  function KeyboardShortcutsDialog(props) {
    const grouped = filtered.reduce((acc, key) => {
      if (!acc[key.category]) {
        acc[key.category] = [];
      }
      acc[key.category].push(key);
      return acc;
    }, {} as { [key: string]: typeof filtered });
    return (
      <Dialog
        isOpen={true}
        title={"Keyboard Shortcuts"}
        width={750}
        onClose={() => props.onClose(false)}
      >
        <Flex sx={{ flexDirection: "column", flexWrap: "nowrap", height: 650 }}>
          {Object.entries(grouped).map(([group, shortcuts]) => {
            return (
              <Flex key={group} sx={{ flexDirection: "column", mb: 2 }}>
                <Text
                  sx={{
                    mt: 1,
                    fontWeight: "bold"
                  }}
                >
                  {group}
                </Text>
                <hr
                  style={{
                    width: "100%",
                    background: "var(--background-secondary)"
                  }}
                />
                {shortcuts.map((shortcut) => {
                  return (
                    <Flex key={shortcut.description} sx={{ mb: 2 }}>
                      <Text
                        variant="subtitle"
                        sx={{ flex: 1, fontWeight: "normal" }}
                      >
                        {shortcut.description}
                      </Text>
                      {shortcut.keys.map((k, i) => (
                        <>
                          {formatKey(k)
                            .split(" ")
                            .map((k) => (
                              <kbd
                                style={{
                                  margin: "0 1px",
                                  background: "var(--background-secondary)",
                                  fontSize: "0.9em",
                                  fontWeight: "bold"
                                }}
                              >
                                {k}
                              </kbd>
                            ))}
                          {shortcut.keys.length - 1 !== i && (
                            <Text sx={{ mx: 1 }}>/</Text>
                          )}
                        </>
                      ))}
                    </Flex>
                  );
                })}
              </Flex>
            );
          })}
        </Flex>
      </Dialog>
    );
  }
);
