/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Perform } from "../../common/dialog-controller";
import Dialog from "./dialog";
import Field from "../field";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Label,
  Radio,
  Text
} from "@theme-ui/components";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { db } from "../../common/db";
import { useStore } from "../../stores/reminder-store";
import { showToast } from "../../utils/toast";
import {
  formatReminderTime,
  Reminder
} from "@notesnook/core/collections/reminders";
import IconTag from "../icon-tag";
import { Clock, Refresh } from "../icons";

export type ReminderPreviewDialogProps = {
  onClose: Perform;
  reminder: Reminder;
};

const RECURRING_MODE_MAP = {
  week: "Weekly",
  day: "Daily",
  month: "Monthly"
} as const;

const SNOOZE_TIMES = [
  {
    id: "5-min",
    title: "5 minutes",
    interval: 60 * 5 * 1000
  },
  {
    id: "10-min",
    title: "10 minutes",
    interval: 60 * 10 * 1000
  },
  { id: "15-min", title: "15 minutes", interval: 60 * 15 * 1000 },
  { id: "1-hour", title: "1 hour", interval: 60 * 60 * 1000 }
];

export default function ReminderPreviewDialog(
  props: ReminderPreviewDialogProps
) {
  const { reminder } = props;

  //   const [selectedDays, setSelectedDays] = useState<number[]>([]);
  //   const [recurringMode, setRecurringMode] = useState<
  //     ValueOf<typeof RecurringModes>
  //   >(RecurringModes.DAY);
  //   const [mode, setMode] = useState<ValueOf<typeof Modes>>(Modes.ONCE);
  //   const [priority, setPriority] = useState<ValueOf<typeof Priorities>>(
  //     Priorities.VIBRATE
  //   );
  //   const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  //   const [time, setTime] = useState(dayjs().format("HH:mm"));
  //   const [title, setTitle] = useState<string>();
  //   const [description, setDescription] = useState<string>();
  //   const refresh = useStore((state) => state.refresh);
  //
  //   useEffect(() => {
  //     setSelectedDays([]);
  //   }, [recurringMode, mode]);
  //
  //   useEffect(() => {
  //     setRecurringMode(RecurringModes.DAY);
  //   }, [mode]);
  //
  //   useEffect(() => {
  //     if (!reminderId) return;
  //     const reminder = db.reminders?.reminder(reminderId);
  //     if (!reminder) return;
  //
  //     setSelectedDays(reminder.selectedDays || []);
  //     setRecurringMode(reminder.recurringMode || RecurringModes.DAY);
  //     setMode(reminder.mode || Modes.ONCE);
  //     setPriority(reminder.priority || Priorities.VIBRATE);
  //     setDate(dayjs(reminder.date).format("YYYY-MM-DD"));
  //     setTime(dayjs(reminder.date).format("HH:mm"));
  //     setTitle(reminder.title);
  //     setDescription(reminder.description);
  //     console.log(reminder);
  //   }, [reminderId]);
  //
  //   const repeatsDaily =
  //     (selectedDays.length === 7 && recurringMode === RecurringModes.WEEK) ||
  //     (selectedDays.length === 31 && recurringMode === RecurringModes.MONTH) ||
  //     recurringMode === RecurringModes.DAY;

  return (
    <Dialog
      isOpen={true}
      title={reminder.title}
      description={reminder.description}
      onClose={props.onClose}
      negativeButton={{
        text: "Close",
        onClick: props.onClose
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          mb: 2
        }}
      >
        {reminder.mode === "repeat" && reminder.recurringMode && (
          <IconTag
            icon={Refresh}
            text={RECURRING_MODE_MAP[reminder.recurringMode]}
          />
        )}
        <IconTag icon={Clock} text={formatReminderTime(reminder)} />
      </Flex>

      <Text variant="body">Remind me in:</Text>
      <Flex
        sx={{
          alignItems: "center",
          my: 1,
          gap: 1
        }}
      >
        {SNOOZE_TIMES.map((time) => (
          <Button
            key={time.id}
            variant="tool"
            onClick={() => {
              db.reminders?.add({
                id: reminder.id,
                snoozeUntil: Date.now() + time.interval
              });
            }}
            sx={{
              borderRadius: 100,
              py: 1,
              px: 2,
              flexShrink: 0
            }}
          >
            {time.title}
          </Button>
        ))}
      </Flex>
    </Dialog>
  );
}
