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

import { formatKey, getGroupedKeybindings } from "@notesnook/common";
import { Flex, Text } from "@theme-ui/components";
import { DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import { isMac } from "../utils/platform";

const groupedKeybindings = getGroupedKeybindings(IS_DESKTOP_APP, isMac());

export const KeyboardShortcutsDialog = DialogManager.register(
  function KeyboardShortcutsDialog(props) {
    return (
      <Dialog
        isOpen={true}
        title={"Keyboard Shortcuts"}
        width={750}
        onClose={() => props.onClose(false)}
      >
        <Flex
          sx={{
            flexDirection: "column",
            flexWrap: "nowrap",
            height: 650
          }}
        >
          {Object.entries(groupedKeybindings).map(([group, shortcuts]) => {
            if (
              shortcuts.length === 0 ||
              shortcuts.every((s) => s.keys.length === 0)
            ) {
              return null;
            }
            return (
              <Flex key={group} sx={{ flexDirection: "column", mb: 2 }}>
                <Text sx={{ mt: 1, fontWeight: "bold" }}>{group}</Text>
                <hr
                  style={{
                    width: "100%",
                    background: "var(--background-secondary)"
                  }}
                />
                {shortcuts.map((shortcut) => {
                  if (shortcut.keys.length === 0) return null;
                  return (
                    <Flex
                      key={shortcut.description}
                      sx={{
                        mb: 2,
                        flexDirection: "row",
                        justifyContent: "space-between"
                      }}
                    >
                      <Text
                        variant="subtitle"
                        sx={{
                          fontWeight: "normal"
                        }}
                      >
                        {shortcut.description}
                      </Text>
                      <Text as="p">
                        {shortcut.keys.map((k, i) => (
                          <>
                            <Keys keys={formatKey(k)} />
                            {shortcut.keys.length - 1 !== i && (
                              <Text as="span" sx={{ mx: 1, fontSize: "0.8em" }}>
                                /
                              </Text>
                            )}
                          </>
                        ))}
                      </Text>
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

function Keys({ keys }: { keys: string }) {
  return keys.split(" ").map((k) => (
    <kbd
      style={{
        margin: "0 1px",
        background: "var(--background-secondary)",
        fontSize: "0.8em",
        fontWeight: "bold"
      }}
    >
      {k}
    </kbd>
  ));
}
