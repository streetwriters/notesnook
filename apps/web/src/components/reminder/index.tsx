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
import { Flex, Text } from "@theme-ui/components";
import {
  Vibrate,
  ReminderOff,
  ArrowCounterClockwise,
  Trash,
  ArrowsClockwise,
  BellSimpleSlash,
  Bell,
  PencilSimple,
  CheckSquare
} from "../icons";
import {
  formatReminderTime,
  formatDate,
  getReminderGroup,
  getUpcomingReminderTime
} from "@notesnook/core";
import { hashNavigate } from "../../navigation";
import { Multiselect } from "../../common/multi-select";
import { store } from "../../stores/reminder-store";
import { db } from "../../common/db";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { MenuItem } from "@notesnook/ui";
import { Reminder as ReminderType } from "@notesnook/core";
import { ConfirmDialog } from "../../dialogs/confirm";
import {
  EditReminderDialog,
  getReminderRepeatText,
  getWeekDays
} from "../../dialogs/add-reminder-dialog";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { strings } from "@notesnook/intl";
import { ReminderCheckbox } from "./reminder-checkbox";
import dayjs from "dayjs";

const PRIORITY_ICON_MAP = {
  silent: BellSimpleSlash,
  vibrate: Vibrate,
  urgent: Bell
} as const;

type ReminderProps = {
  item: ReminderType;
  compact?: boolean;
};

function Reminder(props: ReminderProps) {
  const { item, compact } = props;
  const reminder = item as unknown as ReminderType;
  const PriorityIcon = PRIORITY_ICON_MAP[reminder.priority];
  const dateFormat = useSettingStore((store) => store.dateFormat);
  const timeFormat = useSettingStore((store) => store.timeFormat);
  const weekFormat = useSettingStore((store) => store.weekFormat);
  const completed = Boolean(reminder.completedAt);
  const group = getReminderGroup(reminder);
  const reminderDate =
    reminder.snoozeUntil && reminder.snoozeUntil > Date.now()
      ? formatReminderTime(reminder, true, { dateFormat, timeFormat })
      : formatDate(
          reminder.mode === "repeat"
            ? getUpcomingReminderTime(reminder)
            : reminder.date,
          {
            dateFormat: "ddd,",
            timeFormat,
            type: "date-time"
          }
        );

  async function toggleCompleted() {
    if (completed) {
      await db.reminders.markUncomplete(reminder.id);
    } else {
      await db.reminders.markComplete(reminder.id);
    }
    await store.refresh();
  }

  return (
    <ListItem
      item={item}
      title={
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing3",
            width: "100%"
          }}
        >
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}
          >
            <Flex sx={{ alignItems: "center", gap: "spacing4", minWidth: 0 }}>
              <ReminderCheckbox
                checked={completed}
                onToggle={toggleCompleted}
                size={15}
                checkboxUncheckedIconClassname="reminder-checkbox-unchecked-icon"
              />
              <Text
                data-test-id="title"
                dir="auto"
                sx={{
                  color: "heading",
                  fontSize: compact ? "xs" : "sm",
                  fontWeight: compact ? 400 : 600,
                  overflow: "hidden",
                  textDecoration: completed ? "line-through" : "none",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {reminder.title}
              </Text>
            </Flex>
            <Flex sx={{ alignItems: "center", gap: "spacing3", flexShrink: 0 }}>
              <Flex
                className="reminder-item-elevated-icon"
                sx={{
                  alignItems: "center",
                  backgroundColor: "background-secondary",
                  borderRadius: "radius1",
                  height: 20,
                  justifyContent: "center",
                  width: 20
                }}
              >
                {reminder.disabled ? (
                  <ReminderOff
                    data-test-id="disabled"
                    size={11}
                    color="icon-secondary"
                  />
                ) : (
                  <PriorityIcon size={11} />
                )}
              </Flex>
              {reminder.mode === "repeat" && (
                <Flex
                  className="reminder-item-elevated-icon"
                  sx={{
                    alignItems: "center",
                    backgroundColor: "background-secondary",
                    borderRadius: "radius1",
                    height: 20,
                    justifyContent: "center",
                    width: 20
                  }}
                >
                  <ArrowCounterClockwise size={11} />
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      }
      body={
        !compact && reminder.description ? (
          <Text
            as="p"
            data-test-id="description"
            dir="auto"
            sx={{
              ml: "spacing8",
              color: "paragraph",
              fontSize: "xs",
              lineHeight: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {reminder.description}
          </Text>
        ) : undefined
      }
      isDisabled={reminder.disabled}
      isCompact={false}
      onClick={() => EditReminderDialog.show({ reminderId: reminder.id })}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.moveRemindersToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      sx={{
        borderBottom: "1px solid",
        borderBottomColor: "separator",
        gap: "spacing4",
        px: "spacing6",
        py: "spacing4",
        opacity: completed ? 0.5 : 1,
        ":hover": {
          ".reminder-checkbox-unchecked-icon": {
            color: "border-tertiary"
          },
          ".reminder-item-elevated-icon": {
            backgroundColor: "background-tertiary"
          }
        },
        ...(compact && {
          borderRadius: "radius1",
          p: "spacing2",
          border: 0,
          gap: "spacing1"
        })
      }}
      footer={
        <Flex
          sx={{
            flexDirection: "column",
            gap: compact ? "spacing1" : "spacing3",
            ml: "spacing8"
          }}
        >
          <Text
            data-test-id="reminder-time"
            sx={{
              color:
                group === "Past" ? "paragraph-error" : "paragraph-secondary",
              fontSize: "3xs",
              textDecoration: completed ? "line-through" : "none"
            }}
          >
            {reminderDate}
          </Text>
          {!compact && reminder.mode === "repeat" && reminder.recurringMode && (
            <Flex
              data-test-id="recurring-mode"
              sx={{ alignItems: "center", gap: "spacing3", width: "100%" }}
            >
              <ArrowsClockwise size={11} color="icon-secondary" />
              <Text sx={{ color: "paragraph-secondary", fontSize: "3xs" }}>
                {getReminderRepeatText(
                  reminder.recurringMode,
                  reminder.selectedDays || [],
                  dayjs(reminder.date),
                  getWeekDays(weekFormat)
                )}
              </Text>
            </Flex>
          )}
          {completed && reminder.completedAt && (
            <Text sx={{ color: "paragraph-secondary", fontSize: "3xs" }}>
              Completed:{" "}
              {formatDate(reminder.completedAt, {
                dateFormat: "ddd, MMM D",
                timeFormat,
                type: "date-time"
              })}
            </Text>
          )}
        </Flex>
      }
      menuItems={menuItems}
    />
  );
}

export default React.memo(Reminder, (prev, next) => {
  return (
    prev.item.dateModified === next.item.dateModified &&
    prev.item.completedAt === next.item.completedAt
  );
});

const menuItems: (reminder: ReminderType, items?: string[]) => MenuItem[] = (
  reminder,
  items = []
) => {
  return [
    {
      type: "button",
      key: "edit",
      title: strings.editReminder(),
      iconComponent: PencilSimple,
      isDisabled: Boolean(reminder.completedAt),
      onClick: () => hashNavigate(`/reminders/${reminder.id}/edit`)
    },
    {
      type: "button",
      key: "mark-complete",
      title: "Mark as completed",
      isChecked: Boolean(reminder.completedAt),
      iconComponent: CheckSquare,
      onClick: async () => {
        if (reminder.completedAt) {
          await db.reminders.markUncomplete(reminder.id);
        } else {
          await db.reminders.markComplete(reminder.id);
        }
        await store.refresh();
      }
    },
    {
      type: "button",
      key: "delete",
      title: strings.delete(),
      variant: "dangerous",
      iconComponent: Trash,
      onClick: async () => {
        ConfirmDialog.show({
          title: strings.doActions.delete.reminder(items.length),
          subtitle: strings.irreverisibleAction(),
          positiveButtonText: strings.yes(),
          negativeButtonText: strings.no(),
          positiveButtonVariant: "new_error"
        }).then((result) => {
          result && Multiselect.moveRemindersToTrash(items);
        });
      },
      multiSelect: true
    }
  ];
};
