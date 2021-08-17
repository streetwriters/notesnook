import React, { useMemo } from "react";
import { Flex, Text } from "rebass";
import { useStore as useAppStore } from "../../stores/app-store";
import { Reminders } from "../../common/reminders";
import * as Icon from "../icons";

function ReminderBar() {
  const reminders = useAppStore((store) => store.reminders);
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
      justifyContent="space-between"
      sx={{
        cursor: "pointer",
        borderRadius: "default",
        ":hover": { bg: "hover" },
      }}
      onClick={reminder?.action}
      mx={1}
      p={1}
    >
      <Flex alignItems="center">
        <reminder.icon
          size={18}
          color="primary"
          sx={{ bg: "shade", mr: 2, p: 2, borderRadius: 80 }}
        />
        <Flex variant="columnCenter" alignItems="flex-start">
          <Text display={["block", "none", "block"]} variant="subBody">
            {reminder.subtitle}
          </Text>
          <Text variant="body" fontSize={"body"}>
            {reminder.title}
          </Text>
        </Flex>
      </Flex>
      <Icon.ChevronRight size={20} color="primary" />
    </Flex>
  );
}
export default ReminderBar;
