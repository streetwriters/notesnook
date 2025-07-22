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
            mt: 2,
            gap: 1
          }}
        >
          {groupedKeybindings.map((group) => {
            return (
              <Flex key={group.category} sx={{ flexDirection: "column" }}>
                <Text
                  variant="subtitle"
                  sx={{
                    borderBottom: "1px solid var(--border)",
                    mb: 1,
                    pb: 1
                  }}
                >
                  {group.category}
                </Text>
                {group.shortcuts.map((shortcut) => {
                  return (
                    <Flex
                      key={shortcut.description}
                      sx={{
                        mb: 2,
                        flexDirection: "row",
                        justifyContent: "space-between"
                      }}
                    >
                      <Text variant="body">{shortcut.description}</Text>
                      <Keys keys={shortcut.keys} />
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

function Keys({ keys }: { keys: string[] }) {
  return (
    <Flex sx={{ gap: 1 }}>
      {keys.map((key, index) => (
        <>
          {key.split(" ").map((k) => (
            <Text
              key={k}
              as="code"
              sx={{
                bg: "background",
                color: "paragraph",
                px: 1,
                borderRadius: 5,
                fontSize: "body",
                border: "1px solid var(--border)"
              }}
            >
              {formatKey(k, isMac())}
            </Text>
          ))}
          {keys.length - 1 !== index && (
            <Text as="span" sx={{ fontSize: "0.8em" }}>
              /
            </Text>
          )}
        </>
      ))}
    </Flex>
  );
}
