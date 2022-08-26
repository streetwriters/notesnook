import React, { useMemo } from "react";
import { Button, Flex, Text } from "rebass";
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
      alignItems="center"
      sx={{
        cursor: "pointer",
        borderRadius: "default",
        ":hover": { bg: "hover" }
      }}
      p={1}
      onClick={reminder?.action}
      mx={1}
    >
      <Flex alignItems="center" flex={1}>
        <reminder.icon
          size={18}
          color="primary"
          sx={{ bg: "shade", mr: 2, p: 2, borderRadius: 80 }}
        />
        <Flex variant="columnCenter" alignItems="flex-start">
          <Text variant="body" fontSize={"body"}>
            {reminder.title}
          </Text>
          <Text display={["block", "none", "block"]} variant="subBody">
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
