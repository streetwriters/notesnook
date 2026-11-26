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
import { Box, Flex, Text } from "@theme-ui/components";
import { Fragment } from "react";
import { DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import { isMac } from "../utils/platform";
import { strings } from "@notesnook/intl";

export const KeyboardShortcutsDialog = DialogManager.register(
  function KeyboardShortcutsDialog(props) {
    const groupedKeybindings = getGroupedKeybindings(IS_DESKTOP_APP, isMac());

    return (
      <Dialog
        isOpen={true}
        title={strings.keyboardShortcuts()}
        width={605}
        onClose={() => props.onClose(false)}
      >
        <Flex
          sx={{
            flexDirection: "column",
            flexWrap: "nowrap",
            mt: "spacing6",
            pb: "spacing7",
            gap: "spacing6"
          }}
        >
          {groupedKeybindings.map((group, index) => {
            return (
              <Fragment key={group.category}>
                {index > 0 && (
                  <Box
                    sx={{
                      flexShrink: 0,
                      height: "1px",
                      bg: "separator"
                    }}
                  />
                )}
                <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
                  <Text
                    sx={{
                      fontSize: "3xs",
                      fontWeight: 500,
                      lineHeight: 1,
                      letterSpacing: "0.33px",
                      textTransform: "capitalize",
                      color: "heading-secondary"
                    }}
                  >
                    {group.category}
                  </Text>
                  <Flex sx={{ flexDirection: "column", gap: "spacing2" }}>
                    {group.shortcuts.map((shortcut) => {
                      return (
                        <Flex
                          key={shortcut.description}
                          sx={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "spacing3"
                          }}
                        >
                          <Text
                            sx={{
                              fontSize: "xs",
                              lineHeight: 1,
                              color: "paragraph"
                            }}
                          >
                            {shortcut.description}
                          </Text>
                          <Keys keys={shortcut.keys} />
                        </Flex>
                      );
                    })}
                  </Flex>
                </Flex>
              </Fragment>
            );
          })}
        </Flex>
      </Dialog>
    );
  }
);

function Keys({ keys }: { keys: string[] }) {
  return (
    <Flex sx={{ alignItems: "center", gap: "spacing2", flexShrink: 0 }}>
      {keys.map((key, index) => (
        <Fragment key={key}>
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "center",
              gap: "spacing2",
              px: "spacing2",
              py: "spacing1",
              border: "1px solid var(--border)",
              borderRadius: "radius1"
            }}
          >
            {formatKey(key, isMac())
              .split(" ")
              .map((k, i) => (
                <Text
                  key={k + i}
                  sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}
                >
                  {k}
                </Text>
              ))}
          </Flex>
          {keys.length - 1 !== index && (
            <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}>
              /
            </Text>
          )}
        </Fragment>
      ))}
    </Flex>
  );
}
