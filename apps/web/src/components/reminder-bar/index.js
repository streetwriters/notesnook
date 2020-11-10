import React, { useMemo } from "react";
import { Flex, Text, Box } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import { Reminders } from "../../common/reminders";

function ReminderBar() {
  const reminders = useAppStore((store) => store.reminders);
  const reminder = useMemo(() => {
    const reminder = reminders.sort((a, b) => a.priority - b.priority)[0];
    if (!reminder) return;
    return Reminders[reminder.type];
  }, [reminders]);
  if (!reminder) return null;
  return (
    <Flex
      height={65}
      p={2}
      mt={2}
      bg={"shade"}
      alignItems="center"
      mx={2}
      sx={{ cursor: "pointer", borderRadius: "default" }}
      onClick={reminder?.action?.onClick}
    >
      <Box sx={{ bg: "primary", borderRadius: 80 }} width={40} p={2} mr={2}>
        <reminder.icon size={18} color="static" />
      </Box>
      <Flex flexDirection="column">
        <Text variant="subBody" fontSize={10}>
          {reminder.action.text}
        </Text>
        <Text variant="subBody" fontSize={10} color="primary">
          {reminder.title}
        </Text>
      </Flex>
    </Flex>
  );
}
export default ReminderBar;
