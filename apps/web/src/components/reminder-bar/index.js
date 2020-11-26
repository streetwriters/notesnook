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
      bg={"shade"}
      alignItems="center"
      mx={2}
      mb={1}
      sx={{ cursor: "pointer", borderRadius: "default" }}
      onClick={reminder?.action}
      justifyContent="space-between"
    >
      <Flex>
        <reminder.icon size={14} color="primary" sx={{ mr: 1 }} />
        <Text variant="subBody" fontSize={10} color="primary">
          {reminder.title}
        </Text>
      </Flex>
      <Icon.ArrowRight size={14} color="primary" />
    </Flex>
  );
}
export default ReminderBar;
