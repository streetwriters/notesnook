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

import { memo } from "react";
import dayjs from "dayjs";
import {
  formatDate,
  formatReminderTime,
  getReminderGroup,
  getUpcomingReminderTime,
  type Reminder as ReminderType
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, Text, type MenuItem } from "@ui";
import ListItem from "../list-item";
import { Checkbox } from "../checkbox";
import {
  ArrowCounterClockwise,
  ArrowsClockwise,
  Bell,
  BellSimpleSlash,
  CheckSquare,
  PencilSimple,
  ReminderOff,
  Trash,
  Vibrate
} from "../icons";
import { hashNavigate } from "../../navigation";
import { Multiselect } from "../../common/multi-select";
import { store } from "../../stores/reminder-store";
import { db } from "../../common/db";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { ConfirmDialog } from "../../dialogs/confirm";
import { EditReminderDialog } from "../../dialogs/add-reminder-dialog";
import { showToast } from "../../utils/toast";
import { getReminderRepeatText, getWeekDays } from "./repeat-text";

const PRIORITY_ICON_MAP = {
  silent: BellSimpleSlash,
  vibrate: Vibrate,
  urgent: Bell
} as const;

type ReminderProps = {
  item: ReminderType;
  compact?: boolean;
  index?: number;
};

function ElevatedIcon(props: { children: React.ReactNode }) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        bg: "background-secondary",
        borderRadius: "radius1",
        height: 20,
        justifyContent: "center",
        width: 20,
        ":group-hover": {
          group: "list-item",
          style: { bg: "background-tertiary" }
        }
      }}
    >
      {props.children}
    </Flex>
  );
}

function Reminder(props: ReminderProps) {
  const { item, compact } = props;
  const reminder = item;
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
      showToast("success", "Reminder marked incomplete");
    } else {
      await db.reminders.markComplete(reminder.id);
      showToast("success", "Reminder completed");
    }
    await store.refresh();
  }

  return (
    <ListItem
      item={item}
      index={props.index}
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
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%"
            }}
          >
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                gap: "spacing4",
                minWidth: 0
              }}
            >
              <Checkbox
                checked={completed}
                onToggle={toggleCompleted}
                aria-label={
                  completed
                    ? strings.markReminderIncomplete()
                    : strings.markReminderComplete()
                }
                testID="reminder-complete"
                size={15}
                checkboxUncheckedIconColor="border"
              />
              <Text
                testID="title"
                numberOfLines={1}
                sx={{
                  color: "heading",
                  fontSize: compact ? "xs" : "sm",
                  fontWeight: compact ? 400 : 600,
                  textDecorationLine: completed ? "line-through" : "none"
                }}
              >
                {reminder.title}
              </Text>
            </Flex>
            <Flex
              sx={{
                flexDirection: "row",
                alignItems: "center",
                gap: "spacing3",
                flexShrink: 0
              }}
            >
              <ElevatedIcon>
                {reminder.disabled ? (
                  <ReminderOff
                    testID="disabled"
                    size={11}
                    color="icon-secondary"
                  />
                ) : (
                  <PriorityIcon size={11} color="icon" />
                )}
              </ElevatedIcon>
              {reminder.mode === "repeat" && (
                <ElevatedIcon>
                  <ArrowCounterClockwise size={11} color="icon" />
                </ElevatedIcon>
              )}
            </Flex>
          </Flex>
        </Flex>
      }
      body={
        !compact && reminder.description ? (
          <Text
            testID="description"
            numberOfLines={1}
            sx={{
              ml: "spacing8",
              color: "paragraph",
              fontSize: "xs"
            }}
          >
            {reminder.description}
          </Text>
        ) : undefined
      }
      isDisabled={reminder.disabled}
      isCompact={false}
      onPress={() => EditReminderDialog.show({ reminderId: reminder.id })}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.moveRemindersToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      sx={{
        borderBottom: compact ? "none" : "1px solid",
        borderBottomColor: "separator",
        gap: compact ? "spacing1" : "spacing4",
        px: "spacing6",
        py: "spacing4",
        opacity: completed ? 0.5 : 1,
        ...(compact && {
          borderRadius: "radius1",
          p: "spacing2"
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
            testID="reminder-time"
            sx={{
              color:
                group === "Past" ? "paragraph-error" : "paragraph-secondary",
              fontSize: "3xs",
              textDecorationLine: completed ? "line-through" : "none"
            }}
          >
            {reminderDate}
          </Text>
          {!compact && reminder.mode === "repeat" && reminder.recurringMode && (
            <Flex
              testID="recurring-mode"
              sx={{
                flexDirection: "row",
                alignItems: "center",
                gap: "spacing3",
                width: "100%"
              }}
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
              {strings.completed()}:{" "}
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

export default memo(Reminder, (prev, next) => {
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
      title: strings.markAsCompleted(),
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
