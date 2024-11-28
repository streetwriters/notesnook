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
import Field from "../components/field";
import { Box, Button, Flex, Label, Radio, Text } from "@theme-ui/components";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRef, useState } from "react";
import { db } from "../common/db";
import { useStore } from "../stores/reminder-store";
import { showToast } from "../utils/toast";
import { useIsUserPremium } from "../hooks/use-is-user-premium";
import { Calendar, Pro } from "../components/icons";
import { usePersistentState } from "../hooks/use-persistent-state";
import { DayPicker } from "../components/day-picker";
import { PopupPresenter } from "@notesnook/ui";
import { useStore as useThemeStore } from "../stores/theme-store";
import { getFormattedDate } from "@notesnook/common";
import { MONTHS_FULL, getTimeFormat } from "@notesnook/core";
import { Note, Reminder } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

dayjs.extend(customParseFormat);

export type AddReminderDialogProps = BaseDialogProps<boolean> & {
  reminder?: Reminder;
  note?: Note;
};

type ValueOf<T> = T[keyof T];

const Modes = {
  ONCE: "once",
  REPEAT: "repeat",
  PERMANENT: "permanent"
} as const;

const Priorities = {
  SILENT: "silent",
  VIBRATE: "vibrate",
  URGENT: "urgent"
} as const;

const RecurringModes = {
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
  DAY: "day"
} as const;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const modes = [
  {
    id: Modes.ONCE,
    title: "Once"
  },
  {
    id: Modes.REPEAT,
    title: "Repeat",
    premium: true
  }
];
const priorities = [
  {
    id: Priorities.SILENT,
    title: "Silent"
  },
  {
    id: Priorities.VIBRATE,
    title: "Vibrate"
  },
  {
    id: Priorities.URGENT,
    title: "Urgent"
  }
];
const recurringModes = [
  {
    id: RecurringModes.DAY,
    title: "Daily",
    options: []
  },
  {
    id: RecurringModes.WEEK,
    title: "Weekly",
    options: new Array(7).fill(0).map((_, i) => i)
  },
  {
    id: RecurringModes.MONTH,
    title: "Monthly",
    options: new Array(31).fill(0).map((_, i) => i + 1)
  },
  {
    id: RecurringModes.YEAR,
    title: "Yearly",
    options: []
  }
];

export const AddReminderDialog = DialogManager.register(
  function AddReminderDialog(props: AddReminderDialogProps) {
    const { reminder, note } = props;

    const [selectedDays, setSelectedDays] = useState<number[]>(
      reminder?.selectedDays ?? []
    );
    const [recurringMode, setRecurringMode] = useState<
      ValueOf<typeof RecurringModes>
    >(reminder?.recurringMode ?? RecurringModes.DAY);
    const [mode, setMode] = useState<ValueOf<typeof Modes>>(
      reminder?.mode ?? Modes.ONCE
    );
    const [priority, setPriority] = usePersistentState<
      ValueOf<typeof Priorities>
    >("reminders:default_priority", reminder?.priority ?? Priorities.VIBRATE);
    const [date, setDate] = useState(dayjs(reminder?.date));
    const [title, setTitle] = useState<string>(
      note?.title ?? reminder?.title ?? ""
    );
    const [description, setDescription] = useState<string>(
      note?.headline ?? reminder?.description ?? ""
    );
    const [showCalendar, setShowCalendar] = useState(false);
    const refresh = useStore((state) => state.refresh);
    const isUserPremium = useIsUserPremium();
    const theme = useThemeStore((store) => store.colorScheme);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const repeatsDaily =
      (selectedDays.length === 7 && recurringMode === RecurringModes.WEEK) ||
      (selectedDays.length === 31 && recurringMode === RecurringModes.MONTH) ||
      recurringMode === RecurringModes.DAY;

    return (
      <Dialog
        isOpen={true}
        title={reminder ? strings.editReminder() : strings.newReminder()}
        testId="add-reminder-dialog"
        onClose={() => props.onClose(false)}
        sx={{ fontFamily: "body" }}
        positiveButton={{
          text: reminder ? strings.save() : strings.add(),
          disabled:
            !title ||
            (mode !== Modes.ONCE &&
              recurringMode !== RecurringModes.DAY &&
              recurringMode !== RecurringModes.YEAR &&
              !selectedDays.length),
          onClick: async () => {
            if (!("Notification" in window))
              showToast("warn", strings.remindersNotSupported());

            const permissionResult = await Notification.requestPermission();
            if (!IS_TESTING && permissionResult !== "granted") {
              showToast("error", strings.noNotificationPermission());
              return;
            }

            if (mode !== Modes.REPEAT && date.isBefore(dayjs())) {
              showToast("error", strings.dateError());
              return;
            }

            const id = await db.reminders.add({
              id: reminder?.id,
              recurringMode,
              mode,
              priority,
              selectedDays,
              date: date.valueOf(),
              title,
              description,
              disabled: false,
              ...(date.isAfter(dayjs()) ? { snoozeUntil: 0 } : {})
            });

            if (id && note) {
              await db.relations.add(note, { id, type: "reminder" });
            }

            refresh();
            props.onClose(true);
          }
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
      >
        <Field
          id="title"
          label={strings.title()}
          required
          value={title}
          data-test-id="title-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
        />
        <Field
          as="textarea"
          id="description"
          label={strings.description()}
          data-test-id="description-input"
          helpText={strings.optional()}
          value={description}
          styles={{
            input: {
              height: 100
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
        />
        <Flex sx={{ gap: 2, mt: 2 }}>
          {modes.map((m) => (
            <Label
              key={m.id}
              variant="text.body"
              data-test-id={`mode-${m.id}`}
              sx={{
                width: "auto",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Radio
                id="mode"
                name="mode"
                defaultChecked={m.id === Modes.ONCE}
                checked={m.id === mode}
                disabled={m.premium && !isUserPremium}
                sx={{ color: m.id === mode ? "accent" : "icon" }}
                onChange={() => {
                  if (m.premium && !isUserPremium) return;
                  setMode(m.id);
                  setRecurringMode(RecurringModes.DAY);
                  setSelectedDays([]);
                }}
              />
              {strings.reminderModes(m.id)}
              {m.premium && !isUserPremium && (
                <Pro size={18} color="accent" sx={{ ml: 1 }} />
              )}
            </Label>
          ))}
        </Flex>
        {mode === Modes.REPEAT ? (
          <Flex
            sx={{
              mt: 2,
              bg: "var(--background-secondary)",
              borderRadius: "default",
              p: 1,
              flexDirection: "column"
            }}
          >
            <Flex sx={{ alignItems: "center", gap: 1 }}>
              {recurringModes.map((mode) => (
                <Button
                  key={mode.id}
                  variant="secondary"
                  data-test-id={`recurring-mode-${mode.id}`}
                  onClick={() => {
                    setRecurringMode(mode.id);
                    setSelectedDays([]);
                  }}
                  sx={{
                    borderRadius: 100,
                    py: 1,
                    px: 2,
                    flexShrink: 0,
                    bg:
                      mode.id === recurringMode
                        ? "background-selected"
                        : "transparent",
                    color:
                      mode.id === recurringMode
                        ? "paragraph-selected"
                        : "paragraph"
                  }}
                >
                  {strings.recurringModes(mode.id)}
                </Button>
              ))}
            </Flex>
            {recurringModes.map((mode) =>
              mode.id === recurringMode ? (
                <Box
                  key={mode.id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      mode.id === RecurringModes.WEEK
                        ? "1fr 1fr 1fr 1fr 1fr 1fr 1fr"
                        : "1fr 1fr 1fr 1fr 1fr 1fr 1fr",
                    mt: mode.options.length > 0 ? 1 : 0,
                    maxHeight: 150,
                    overflowY: "auto",
                    gap: 1
                  }}
                >
                  {mode.options.map((day, i) => (
                    <Button
                      key={day}
                      variant="secondary"
                      data-test-id={`day-${day}`}
                      onClick={() => {
                        setSelectedDays((days) => {
                          const clone = days.slice();
                          if (clone.indexOf(day) > -1)
                            clone.splice(clone.indexOf(day), 1);
                          else clone.push(day);
                          return clone;
                        });
                      }}
                      sx={{
                        borderRadius: "default",
                        py: 1,
                        px: 2,
                        flexShrink: 0,
                        textAlign: "left",
                        bg: selectedDays.includes(day)
                          ? "background-selected"
                          : "transparent",
                        color: selectedDays.includes(day)
                          ? "paragraph-selected"
                          : "paragraph"
                      }}
                    >
                      {mode.id === "week" ? WEEK_DAYS[i] : day}
                    </Button>
                  ))}
                </Box>
              ) : null
            )}
          </Flex>
        ) : null}

        <Flex sx={{ gap: 2, overflowX: "auto", mt: 2 }}>
          {mode === Modes.ONCE ? (
            <>
              <Field
                id="date"
                label={strings.date()}
                required
                inputRef={dateInputRef}
                data-test-id="date-input"
                helpText={`${db.settings.getDateFormat()}`}
                action={{
                  icon: Calendar,
                  onClick() {
                    setShowCalendar(true);
                  }
                }}
                validate={(t) =>
                  dayjs(t, db.settings.getDateFormat(), true).isValid()
                }
                defaultValue={date.format(db.settings.getDateFormat())}
                onChange={(e) => setDate((d) => setDateOnly(e.target.value, d))}
              />
              <PopupPresenter
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                position={{
                  isTargetAbsolute: true,
                  target: dateInputRef.current,
                  location: "top"
                }}
              >
                <DayPicker
                  sx={{
                    bg: "background",
                    p: 2,
                    boxShadow: `0px 0px 25px 5px ${
                      theme === "dark" ? "#000000aa" : "#0000004e"
                    }`,
                    borderRadius: "dialog",
                    width: 300
                  }}
                  selected={dayjs(date).toDate()}
                  minDate={new Date()}
                  maxDate={new Date(new Date().getFullYear() + 99, 11, 31)}
                  onSelect={(day) => {
                    if (!day) return;
                    const date = getFormattedDate(day, "date");
                    setDate((d) => setDateOnly(date, d));
                    if (dateInputRef.current) dateInputRef.current.value = date;
                  }}
                />
              </PopupPresenter>
            </>
          ) : recurringMode === RecurringModes.YEAR ? (
            <>
              <LabeledSelect
                id="month"
                label={strings.month()}
                value={`${dayjs(date).month()}`}
                options={MONTHS_FULL.map((month, index) => ({
                  value: `${index}`,
                  title: month
                }))}
                onSelectionChanged={(month) => {
                  setDate((d) => d.month(parseInt(month)));
                }}
              />
              <LabeledSelect
                id="day"
                label={strings.day()}
                value={`${dayjs(date).date()}`}
                options={new Array(dayjs(date).daysInMonth())
                  .fill("0")
                  .map((_, day) => ({
                    value: `${day + 1}`,
                    title: `${day + 1}`
                  }))}
                onSelectionChanged={(day) => {
                  setDate((d) => d.date(parseInt(day)));
                }}
              />
            </>
          ) : null}
          <Field
            id="time"
            label={strings.time()}
            required
            data-test-id="time-input"
            helpText={`${
              db.settings.getTimeFormat() === "12-hour"
                ? "hh:mm AM/PM"
                : "hh:mm"
            }`}
            validate={(t) => {
              const format =
                db.settings.getTimeFormat() === "12-hour" ? "hh:mm a" : "HH:mm";
              return dayjs(t.toLowerCase(), format, true).isValid();
            }}
            defaultValue={date.format(
              getTimeFormat(db.settings.getTimeFormat())
            )}
            onChange={(e) => setDate((d) => setTimeOnly(e.target.value, d))}
          />
        </Flex>
        <Flex sx={{ gap: 2, mt: 2 }}>
          {priorities.map((p) => (
            <Label
              key={p.id}
              variant="text.body"
              data-test-id={`priority-${p.id}`}
              sx={{
                width: "auto",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Radio
                id="priority"
                name="priority"
                sx={{ color: p.id === priority ? "accent" : "icon" }}
                defaultChecked={p.id === Priorities.VIBRATE}
                checked={p.id === priority}
                onChange={() => setPriority(p.id)}
              />
              {strings.reminderNotificationModes(p.title)}
            </Label>
          ))}
        </Flex>

        {mode === Modes.REPEAT ? (
          <Text variant="subBody" sx={{ mt: 1 }}>
            {selectedDays.length === 0 && recurringMode !== RecurringModes.DAY
              ? recurringMode === RecurringModes.WEEK
                ? strings.reminderRepeatStrings.week.selectDays()
                : strings.reminderRepeatStrings.month.selectDays()
              : repeatsDaily
              ? strings.reminderRepeatStrings.day(date.format(timeFormat()))
              : strings.reminderRepeatStrings.repeats(
                  1,
                  recurringMode,
                  getSelectedDaysText(selectedDays, recurringMode),
                  date.format(timeFormat())
                )}
          </Text>
        ) : (
          <Text variant="subBody" sx={{ mt: 1 }}>
            {strings.reminderStarts(date.toString(), date.format(timeFormat()))}
          </Text>
        )}
      </Dialog>
    );
  }
);

function setTimeOnly(str: string, date: dayjs.Dayjs) {
  const value = dayjs(str, timeFormat(), true);
  return date.hour(value.hour()).minute(value.minute());
}

function timeFormat() {
  return getTimeFormat(db.settings.getTimeFormat());
}

function setDateOnly(str: string, date: dayjs.Dayjs) {
  const value = dayjs(str, db.settings.getDateFormat(), true);
  return date.year(value.year()).month(value.month()).date(value.date());
}

function getSelectedDaysText(
  selectedDays: number[],
  recurringMode: ValueOf<typeof RecurringModes>
) {
  const text = selectedDays
    .sort((a, b) => a - b)
    .map((day, index) => {
      const isLast = index === selectedDays.length - 1;
      const isSecondLast = index === selectedDays.length - 2;
      const joinWith = isSecondLast ? " & " : isLast ? "" : ", ";
      return recurringMode === RecurringModes.WEEK
        ? WEEK_DAYS[day] + joinWith
        : `${day}${nth(day)} ${joinWith}`;
    })
    .join("");
  return text;
}

function nth(n: number) {
  return (
    ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
    "th"
  );
}

type LabeledSelectProps = {
  label: string;
  id: string;
  options: { value: string; title: string }[];
  value: string;
  onSelectionChanged: (value: string) => void;
};
function LabeledSelect(props: LabeledSelectProps) {
  const { id, label, options, value, onSelectionChanged } = props;
  return (
    <Label
      htmlFor={id}
      variant="text.body"
      sx={{
        m: "2px",
        mr: "2px",
        fontSize: "subtitle",
        fontWeight: "bold",
        fontFamily: "body",
        color: "paragraph",
        flexDirection: "column",
        width: "auto",
        "& > select": {
          mt: 1,
          backgroundColor: "background",
          // outline: "none",
          border: "none",
          outline: "1.5px solid var(--border)",
          borderRadius: "default",
          color: "paragraph",
          padding: 2,
          fontFamily: "body",
          fontSize: "input"
        }
      }}
    >
      {label}
      <select
        value={value}
        onChange={(e) => onSelectionChanged(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.title}
          </option>
        ))}
      </select>
    </Label>
  );
}

type EditReminderDialogProps = { reminderId: string };
export const EditReminderDialog = {
  show: async (props: EditReminderDialogProps) => {
    const reminder = await db.reminders.reminder(props.reminderId);
    if (!reminder) return;
    return AddReminderDialog.show({ reminder });
  }
};
