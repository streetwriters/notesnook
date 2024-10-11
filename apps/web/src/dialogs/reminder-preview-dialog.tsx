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

import Dialog from "../components/dialog";
import { Button, Flex, Text } from "@theme-ui/components";
import { db } from "../common/db";
import { Reminder } from "@notesnook/core";
import IconTag from "../components/icon-tag";
import { Clock, Refresh } from "../components/icons";
import Note from "../components/note";
import { getFormattedReminderTime, usePromise } from "@notesnook/common";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

export type ReminderPreviewDialogProps = BaseDialogProps<false> & {
  reminder: Reminder;
};

const RECURRING_MODE_MAP = {
  week: "Weekly",
  day: "Daily",
  month: "Monthly",
  year: "Yearly"
} as const;

const SNOOZE_TIMES = [
  {
    id: "5-min",
    title: strings.minutes(5),
    interval: 60 * 5 * 1000
  },
  {
    id: "10-min",
    title: strings.minutes(10),
    interval: 60 * 10 * 1000
  },
  { id: "15-min", title: strings.minutes(15), interval: 60 * 15 * 1000 },
  { id: "1-hour", title: strings.hours(1), interval: 60 * 60 * 1000 }
];

export const ReminderPreviewDialog = DialogManager.register(
  function ReminderPreviewDialog(props: ReminderPreviewDialogProps) {
    const { reminder } = props;
    const referencedNotes = usePromise(
      () =>
        db.relations
          .to({ id: reminder.id, type: "reminder" }, "note")
          .resolve(),
      [reminder.id]
    );

    return (
      <Dialog
        isOpen={true}
        title={reminder.title}
        description={reminder.description}
        onClose={() => props.onClose(false)}
        negativeButton={{
          text: strings.close(),
          onClick: () => props.onClose(false)
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
          <IconTag icon={Clock} text={getFormattedReminderTime(reminder)} />
        </Flex>

        <Text variant="body">{strings.remindMeIn()}:</Text>
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
              variant="secondary"
              onClick={() => {
                db.reminders.add({
                  id: reminder.id,
                  snoozeUntil: Date.now() + time.interval
                });
                props.onClose(false);
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
        {referencedNotes &&
          referencedNotes.status === "fulfilled" &&
          referencedNotes.value.length > 0 && (
            <>
              <Text variant="body">{strings.references()}:</Text>
              {referencedNotes.value.map((item, index) => (
                <Note
                  key={item.id}
                  item={item}
                  date={item.dateCreated}
                  compact
                />
              ))}
            </>
          )}
      </Dialog>
    );
  }
);
