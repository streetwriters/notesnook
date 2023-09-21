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

import React from "react";
import ListItem from "../list-item";
import { Flex } from "@theme-ui/components";
import {
  Silent,
  Vibrate,
  Loud,
  ReminderOff,
  Clock,
  Refresh,
  Edit,
  Reminders,
  Trash
} from "../icons";
import IconTag from "../icon-tag";
import {
  Reminder as ReminderType,
  isReminderToday
} from "@notesnook/core/dist/collections/reminders";
import { hashNavigate } from "../../navigation";
import { Multiselect } from "../../common/multi-select";
import { store } from "../../stores/reminder-store";
import { db } from "../../common/db";
import {
  confirm,
  showEditReminderDialog
} from "../../common/dialog-controller";
import { pluralize } from "@notesnook/common";
import { getFormattedReminderTime } from "@notesnook/common";
import { Item } from "../list-container/types";
import { MenuItem } from "@notesnook/ui";

const RECURRING_MODE_MAP = {
  week: "Weekly",
  day: "Daily",
  month: "Monthly"
} as const;

const PRIORITY_ICON_MAP = {
  silent: Silent,
  vibrate: Vibrate,
  urgent: Loud
} as const;

type ReminderProps = {
  item: Item;
  simplified?: boolean;
};

function Reminder(props: ReminderProps) {
  const { item, simplified } = props;
  const reminder = item as unknown as ReminderType;
  const PriorityIcon = PRIORITY_ICON_MAP[reminder.priority];
  return (
    <ListItem
      item={item}
      title={reminder.title}
      body={reminder.description}
      isDisabled={reminder.disabled}
      isSimple={simplified}
      onClick={() => showEditReminderDialog(reminder.id)}
      footer={
        <Flex
          sx={{
            alignItems: "center",
            gap: 1
          }}
        >
          {reminder.disabled ? null : <PriorityIcon size={14} />}
          {reminder.disabled ? (
            <IconTag icon={ReminderOff} text={"Disabled"} testId={"disabled"} />
          ) : (
            <IconTag
              icon={Clock}
              text={getFormattedReminderTime(reminder)}
              highlight={isReminderToday(reminder)}
              testId={"reminder-time"}
            />
          )}
          {reminder.mode === "repeat" && reminder.recurringMode && (
            <IconTag
              icon={Refresh}
              text={RECURRING_MODE_MAP[reminder.recurringMode]}
              testId={`recurring-mode`}
            />
          )}
        </Flex>
      }
      menuItems={menuItems}
    />
  );
}

export default React.memo(Reminder, (prev, next) => {
  return prev?.item?.title === next?.item?.title;
});

const menuItems: (
  reminder: ReminderType,
  items?: ReminderType[]
) => MenuItem[] = (reminder, items = []) => {
  return [
    {
      type: "button",
      key: "edit",
      title: "Edit",
      icon: Edit.path,
      onClick: () => hashNavigate(`/reminders/${reminder.id}/edit`)
    },
    {
      type: "button",
      key: "toggle",
      title: reminder.disabled ? "Activate" : "Deactivate",
      icon: reminder.disabled ? Reminders.path : ReminderOff.path,
      onClick: async () => {
        await db.reminders?.add({
          id: reminder.id,
          disabled: !reminder.disabled
        });
        store.refresh();
      }
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      title: "Delete",
      variant: "dangerous",
      icon: Trash.path,
      onClick: async () => {
        confirm({
          title: `Delete ${pluralize(items.length, "reminder")}`,
          message: `Are you sure you want to proceed? **This action is IRREVERSIBLE**.`,
          positiveButtonText: "Yes",
          negativeButtonText: "No"
        }).then((result) => {
          result && Multiselect.moveRemindersToTrash(items);
        });
      },
      multiSelect: true
    }
  ];
};
