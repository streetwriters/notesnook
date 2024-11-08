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
import { isReminderToday } from "@notesnook/core";
import { hashNavigate } from "../../navigation";
import { Multiselect } from "../../common/multi-select";
import { store } from "../../stores/reminder-store";
import { db } from "../../common/db";
import { getFormattedReminderTime } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { Reminder as ReminderType } from "@notesnook/core";
import { ConfirmDialog } from "../../dialogs/confirm";
import { EditReminderDialog } from "../../dialogs/add-reminder-dialog";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { strings } from "@notesnook/intl";

const RECURRING_MODE_MAP = {
  week: "Weekly",
  day: "Daily",
  month: "Monthly",
  year: "Yearly"
} as const;

const PRIORITY_ICON_MAP = {
  silent: Silent,
  vibrate: Vibrate,
  urgent: Loud
} as const;

type ReminderProps = {
  item: ReminderType;
  compact?: boolean;
};

function Reminder(props: ReminderProps) {
  const { item, compact } = props;
  const reminder = item as unknown as ReminderType;
  const PriorityIcon = PRIORITY_ICON_MAP[reminder.priority];
  return (
    <ListItem
      item={item}
      title={reminder.title}
      body={reminder.description}
      isDisabled={reminder.disabled}
      isCompact={compact}
      onClick={() => EditReminderDialog.show({ reminderId: reminder.id })}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.moveRemindersToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
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
  return prev.item.dateModified === next.item.dateModified;
});

const menuItems: (reminder: ReminderType, items?: string[]) => MenuItem[] = (
  reminder,
  items = []
) => {
  return [
    {
      type: "button",
      key: "edit",
      title: strings.edit(),
      icon: Edit.path,
      onClick: () => hashNavigate(`/reminders/${reminder.id}/edit`)
    },
    {
      type: "button",
      key: "toggle",
      title: reminder.disabled ? strings.activate() : strings.deactivate(),
      icon: reminder.disabled ? Reminders.path : ReminderOff.path,
      onClick: async () => {
        await db.reminders.add({
          id: reminder.id,
          disabled: !reminder.disabled
        });
        await store.refresh();
      }
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      title: strings.delete(),
      variant: "dangerous",
      icon: Trash.path,
      onClick: async () => {
        ConfirmDialog.show({
          title: strings.doActions.delete.reminder(items.length),
          message: strings.irreverisibleAction(),
          positiveButtonText: strings.yes(),
          negativeButtonText: strings.no()
        }).then((result) => {
          result && Multiselect.moveRemindersToTrash(items);
        });
      },
      multiSelect: true
    }
  ];
};
