import React, { useMemo } from "react";
import { Flex, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import { Reminders } from "../../common/reminders";
import * as Icon from "../icons";

function ReminderBar() {
  const reminders = useAppStore((store) => store.reminders);
  const reminder = useMemo(() => {
    const copy = reminders.slice();
    const reminder = copy.sort((a, b) => a.priority - b.priority)[0];
    if (!reminder) return;
    return Reminders[reminder.type];
  }, [reminders]);
  if (!reminder) return null;
  return (
    <Flex
      p={1}
      bg={"primary"}
      alignItems="center"
      mb={1}
      px={2}
      sx={{ cursor: "pointer" }}
      onClick={reminder?.action}
      justifyContent="space-between"
    >
      <Flex alignItems="center">
        <reminder.icon size={14} color="static" sx={{ mr: 1 }} />
        <Text variant="body" fontSize={"body"} color="static">
          {reminder.title}
        </Text>
      </Flex>
      <Icon.ArrowRight size={14} color="static" />
    </Flex>
  );
}
export default ReminderBar;
