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

import { Fragment } from "react";
import { formatKey, getGroupedKeybindings } from "@notesnook/common";
import { Dialog, Flex, Text } from "@ui";
import { environment } from "@platform";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { isMac } from "../utils/platform";
import { strings } from "@notesnook/intl";

export const KeyboardShortcutsDialog = DialogManager.register(
  function KeyboardShortcutsDialog(props: BaseDialogProps<boolean>) {
    const groupedKeybindings = getGroupedKeybindings(
      environment.isDesktopApp,
      isMac()
    );
    return (
      <Dialog
        isOpen={true}
        title={strings.keyboardShortcuts()}
        width={750}
        onClose={() => props.onClose(false)}
      >
        <Flex sx={{ flexDirection: "column", mt: 2, gap: 1 }}>
          {groupedKeybindings.map((group) => {
            return (
              <Flex key={group.category} sx={{ flexDirection: "column" }}>
                <Text
                  variant="subtitle"
                  sx={{
                    borderBottom: "1px solid",
                    borderBottomColor: "border",
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
    <Flex sx={{ gap: 1, flexDirection: "row", alignItems: "center" }}>
      {keys.map((key, index) => (
        <Fragment key={key}>
          {key.split(" ").map((k) => (
            <Text
              key={k}
              sx={{
                bg: "background",
                color: "paragraph",
                px: 1,
                borderRadius: 5,
                fontFamily: "monospace",
                fontSize: "body",
                border: "1px solid",
                borderColor: "border"
              }}
            >
              {formatKey(k, isMac())}
            </Text>
          ))}
          {keys.length - 1 !== index && (
            <Text sx={{ fontSize: "subBody" }}>/</Text>
          )}
        </Fragment>
      ))}
    </Flex>
  );
}
