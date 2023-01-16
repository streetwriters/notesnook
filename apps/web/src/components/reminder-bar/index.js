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

import { useMemo } from "react";
import { Button, Flex, Text } from "@theme-ui/components";
import { useStore as useAppStore } from "../../stores/app-store";
import { Reminders } from "../../common/reminders";
import * as Icon from "../icons";
import Config from "../../utils/config";

function ReminderBar() {
  const reminders = useAppStore((store) => store.reminders);
  const dismissReminders = useAppStore((store) => store.dismissReminders);
  const reminder = useMemo(() => {
    if (!reminders) return null;

    const copy = reminders.slice();
    const reminder = copy.sort((a, b) => a.priority - b.priority)[0];
    if (!reminder) return;
    return Reminders[reminder.type];
  }, [reminders]);

  if (!reminder) return null;
  return (
    <Flex
      sx={{
        cursor: "pointer",
        borderRadius: "default",
        ":hover": { bg: "hover" },
        alignItems: "center"
      }}
      p={1}
      onClick={reminder?.action}
      mx={1}
    >
      <Flex sx={{ flex: 1, alignItems: "center" }}>
        <reminder.icon
          size={18}
          color="primary"
          sx={{ bg: "shade", mr: 2, p: 2, borderRadius: 80 }}
        />
        <Flex variant="columnCenter" sx={{ alignItems: "flex-start" }}>
          <Text variant="body" sx={{ fontSize: "body" }}>
            {reminder.title}
          </Text>
          <Text variant="subBody" sx={{ display: "block" }}>
            {reminder.subtitle}
          </Text>
        </Flex>
      </Flex>
      {reminder.dismissable && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            const dontShowAgain = window.confirm(
              "Don't show again on this device?"
            );
            dismissReminders(reminder);
            if (dontShowAgain) {
              Config.set(`ignored:${reminder.key}`, true);
            }
          }}
          sx={{
            borderRadius: 50,
            p: 1,
            mr: 1,
            bg: "transparent",
            ":hover": { backgroundColor: "shade" }
          }}
          variant="tool"
        >
          <Icon.Dismiss size={20} color="primary" />
        </Button>
      )}
    </Flex>
  );
}
export default ReminderBar;
