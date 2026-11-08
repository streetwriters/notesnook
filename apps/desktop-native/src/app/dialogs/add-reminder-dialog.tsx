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

import { useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Dialog, Flex, Select, Text } from "@ui";
import { notifications, environment } from "@platform";
import {
  getFormattedDate,
  useIsFeatureAvailable,
  usePromise
} from "@notesnook/common";
import { getTimeFormat, Note, Reminder } from "@notesnook/core";
import { i18n, strings } from "@notesnook/intl";
import { db } from "../common/db";
import { useStore } from "../stores/reminder-store";
import { useStore as useSettingsStore } from "../stores/setting-store";
import { showToast } from "../utils/toast";
import { CalendarDots, CaretDown, Clock } from "../components/icons";
import { usePersistentState } from "../hooks/use-persistent-state";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { checkFeature } from "../common";
import { setTimeOnly, setDateOnly } from "../utils/date-time";
import { Field } from "./components/field";
import { DayPicker } from "../components/day-picker";
import { InlinePopup } from "./components/inline-popup";
import { NoteReference } from "./components/note-reference";
import { Fieldset, ReminderRadioButton } from "./components/radio-button";

dayjs.extend(customParseFormat);

const MAX_DATE = dayjs().add(99, "year").endOf("year").toDate();

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

const modes = [
  {
    id: Modes.ONCE,
    title: "Once"
  },
  {
    id: Modes.REPEAT,
    title: "Repeat"
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

    const weekFormat = useSettingsStore((store) => store.weekFormat);
    const weekDays = getWeekDays(weekFormat);
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
    const [dateKey, setDateKey] = useState(0);
    const [title, setTitle] = useState<string>(
      note?.title ?? reminder?.title ?? ""
    );
    const [description, setDescription] = useState<string>(
      note?.headline ?? reminder?.description ?? ""
    );
    const [showCalendar, setShowCalendar] = useState(false);
    const [showMonthlyDays, setShowMonthlyDays] = useState(false);
    const [isReminderDateValid, setIsReminderDateValid] = useState(true);
    const refresh = useStore((state) => state.refresh);
    const repeatModeAvailability = useIsFeatureAvailable("recurringReminders");
    const referencedNotes = usePromise(
      () =>
        reminder?.id
          ? db.relations
              .to({ id: reminder.id, type: "reminder" }, "note")
              .resolve()
          : null,
      [reminder?.id]
    );

    const toggleDay = (day: number) =>
      setSelectedDays((days) => {
        const clone = days.slice();
        if (clone.indexOf(day) > -1) clone.splice(clone.indexOf(day), 1);
        else clone.push(day);
        return clone;
      });

    return (
      <Dialog
        isOpen={true}
        title={reminder ? strings.editReminder() : strings.newReminder()}
        testID="add-reminder-dialog"
        onClose={() => props.onClose(false)}
        width={700}
        positiveButton={{
          text: reminder ? strings.save() : strings.add(),
          disabled:
            !title ||
            !isReminderDateValid ||
            (mode !== Modes.ONCE &&
              recurringMode !== RecurringModes.DAY &&
              recurringMode !== RecurringModes.YEAR &&
              !selectedDays.length),
          onClick: async () => {
            if (mode !== Modes.REPEAT && date.isBefore(dayjs())) {
              showToast("error", strings.dateError());
              return;
            }

            if (mode !== Modes.REPEAT && date.isAfter(MAX_DATE)) {
              showToast(
                "error",
                strings.maximumReminderDate(getFormattedDate(MAX_DATE, "date"))
              );
              return;
            }

            const permissionResult = await notifications.requestPermission();
            if (!environment.isTesting && !permissionResult) {
              showToast("warn", strings.noNotificationPermission());
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
            showToast("success", "Reminder created!");
            props.onClose(true);
          }
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
      >
        <Fieldset title={strings.reminderDetails()}>
          <Flex sx={{ gap: "spacing6", flexDirection: "column" }}>
            <Field
              id="title"
              label={strings.title()}
              required
              value={title}
              placeholder={strings.reminderTitlePlaceholder()}
              testID="title-input"
              styles={{ input: { height: 45 } }}
              onChangeText={setTitle}
            />
            <Field
              as="textarea"
              id="description"
              label={`${strings.description()} (${strings.optional()})`}
              testID="description-input"
              placeholder={strings.reminderDetailsPlaceholder()}
              value={description}
              styles={{
                input: { height: 100 },
                helpText: { fontSize: "xs" }
              }}
              onChangeText={setDescription}
            />
          </Flex>
        </Fieldset>
        <Fieldset title={strings.reminderModes("repeat")}>
          <Flex
            sx={{
              gap: "spacing4",
              alignItems: "center",
              flexDirection: "row"
            }}
          >
            {modes.map((m) => (
              <ReminderRadioButton
                key={m.id}
                testId={`mode-${m.id}`}
                label={strings.reminderModes(m.id)}
                selected={m.id === mode}
                premium={
                  m.id === "repeat" && !repeatModeAvailability?.isAllowed
                }
                onClick={() => {
                  setMode(m.id);
                  setRecurringMode(RecurringModes.DAY);
                  setSelectedDays([]);
                }}
              />
            ))}
          </Flex>
          {mode === Modes.REPEAT ? (
            <Flex
              sx={{
                alignItems: "center",
                flexDirection: "row",
                gap: "spacing4",
                mt: "spacing6",
                justifyContent: "space-between"
              }}
            >
              {recurringModes.map((mode) => (
                <ReminderRadioButton
                  key={mode.id}
                  testId={`recurring-mode-${mode.id}`}
                  label={strings.recurringModes(mode.id)}
                  selected={mode.id === recurringMode}
                  sx={{ flex: 1 }}
                  onClick={() => {
                    setRecurringMode(mode.id);
                    setSelectedDays([]);
                  }}
                />
              ))}
            </Flex>
          ) : null}
        </Fieldset>

        <Fieldset title={strings.schedule()}>
          <Flex sx={{ gap: "spacing6", flexDirection: "row" }}>
            {mode === Modes.ONCE ? (
              <Flex sx={{ flex: 1, position: "relative" }}>
                <Field
                  key={dateKey}
                  id="date"
                  label={strings.selectDate()}
                  required
                  testID="date-input"
                  placeholder={`${db.settings.getDateFormat()}`}
                  action={{
                    icon: CalendarDots,
                    onPress: () => setShowCalendar((s) => !s)
                  }}
                  sx={{ flex: 1 }}
                  styles={{ input: { height: 45 } }}
                  validate={(t) => {
                    const isValid = dayjs(
                      t,
                      db.settings.getDateFormat(),
                      true
                    ).isValid();
                    setIsReminderDateValid(isValid);
                    return isValid;
                  }}
                  defaultValue={date.format(db.settings.getDateFormat())}
                  onChangeText={(text) => setDate((d) => setDateOnly(text, d))}
                />
                <InlinePopup isOpen={showCalendar} sx={{ top: 70 }}>
                  <DayPicker
                    sx={{ p: 2, width: 300 }}
                    selected={dayjs(date).toDate()}
                    minDate={new Date()}
                    maxDate={MAX_DATE}
                    onSelect={(day) => {
                      const formatted = getFormattedDate(day, "date");
                      setDate((d) => setDateOnly(formatted, d));
                      setDateKey((k) => k + 1);
                      setShowCalendar(false);
                    }}
                  />
                </InlinePopup>
              </Flex>
            ) : recurringMode === RecurringModes.YEAR ? (
              <Flex sx={{ flex: 1, gap: "spacing6", flexDirection: "row" }}>
                <ReminderSelect
                  id="month"
                  label={strings.selectMonth()}
                  value={`${dayjs(date).month()}`}
                  options={getMonthNames().map((month, index) => ({
                    value: `${index}`,
                    title: month
                  }))}
                  onSelectionChanged={(month) => {
                    setDate((d) => d.month(parseInt(month)));
                  }}
                />
                <ReminderSelect
                  id="day"
                  label={strings.selectDate()}
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
              </Flex>
            ) : null}
            {mode === Modes.REPEAT && recurringMode === RecurringModes.MONTH ? (
              <Flex
                sx={{
                  flex: 1,
                  minWidth: 0,
                  flexDirection: "column",
                  gap: "spacing4",
                  position: "relative"
                }}
              >
                <Text
                  sx={{
                    color: "paragraph-secondary",
                    fontSize: "xs",
                    lineHeight: 1.2
                  }}
                >
                  {strings.selectDay()}
                </Text>
                <Flex
                  onPress={() => setShowMonthlyDays((s) => !s)}
                  sx={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderRadius: "radius2",
                    px: "spacing4",
                    py: "spacing6",
                    bg: "background-secondary"
                  }}
                >
                  <Text sx={{ color: "paragraph", fontSize: "sm" }}>
                    {selectedDays.length
                      ? strings.daysOfEveryMonth(selectedDays.length)
                      : strings.selectDay()}
                  </Text>
                  <CaretDown size={13} color="icon" />
                </Flex>
                <InlinePopup
                  isOpen={showMonthlyDays}
                  sx={{
                    top: 70,
                    width: 307,
                    px: "spacing3",
                    py: "spacing6",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    rowGap: "spacing6"
                  }}
                >
                  {new Array(31).fill(0).map((_, index) => {
                    const day = index + 1;
                    const selected = selectedDays.includes(day);
                    return (
                      <Flex
                        key={day}
                        testID={`day-${day}`}
                        onPress={() => toggleDay(day)}
                        sx={{
                          width: 43,
                          height: 29,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "radius1",
                          bg: selected ? "background-selected" : "transparent"
                        }}
                      >
                        <Text
                          sx={{
                            color: selected
                              ? "paragraph-selected"
                              : "paragraph",
                            fontSize: "sm"
                          }}
                        >
                          {day}
                        </Text>
                      </Flex>
                    );
                  })}
                </InlinePopup>
              </Flex>
            ) : null}
            {mode === Modes.REPEAT && recurringMode === RecurringModes.WEEK ? (
              <Flex
                sx={{
                  flex: 1,
                  minWidth: 0,
                  flexDirection: "column",
                  gap: "spacing4"
                }}
              >
                <Text
                  sx={{
                    color: "paragraph-secondary",
                    fontSize: "xs",
                    lineHeight: 1.2
                  }}
                >
                  {strings.reminderSelectDays()}
                </Text>
                <Flex
                  sx={{
                    gap: "spacing3",
                    alignItems: "stretch",
                    flexDirection: "row",
                    flex: 1
                  }}
                >
                  {recurringModes
                    .find((item) => item.id === RecurringModes.WEEK)
                    ?.options.map((day, i) => (
                      <Flex
                        key={day}
                        testID={`day-${day}`}
                        onPress={() => toggleDay(day)}
                        sx={{
                          flex: 1,
                          minWidth: 0,
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid",
                          borderColor: selectedDays.includes(day)
                            ? "transparent"
                            : "border",
                          borderRadius: "radius2",
                          px: "spacing4",
                          py: "spacing4",
                          bg: selectedDays.includes(day)
                            ? "background-selected"
                            : "transparent"
                        }}
                      >
                        <Text
                          sx={{
                            color: selectedDays.includes(day)
                              ? "paragraph-selected"
                              : "paragraph",
                            fontSize: "sm",
                            fontWeight: selectedDays.includes(day)
                              ? 500
                              : "body",
                            lineHeight: 1
                          }}
                        >
                          {weekDays[i][0]}
                        </Text>
                      </Flex>
                    ))}
                </Flex>
              </Flex>
            ) : null}
            <Field
              id="time"
              label={strings.enterTime()}
              required
              testID="time-input"
              sx={{ flex: 1, alignSelf: "flex-start" }}
              rightIcon={Clock}
              placeholder={
                db.settings.getTimeFormat() === "12-hour"
                  ? "hh:mm AM/PM"
                  : "hh:mm"
              }
              styles={{ input: { height: 45 } }}
              validate={(t) => {
                const format =
                  db.settings.getTimeFormat() === "12-hour"
                    ? "hh:mm a"
                    : "HH:mm";
                const isValid = dayjs(t.toLowerCase(), format, true).isValid();
                setIsReminderDateValid(isValid);
                return isValid;
              }}
              defaultValue={date.format(
                getTimeFormat(db.settings.getTimeFormat())
              )}
              onChangeText={(text) => setDate((d) => setTimeOnly(text, d))}
            />
          </Flex>
        </Fieldset>
        <Fieldset title={strings.alertMode()}>
          <Flex sx={{ gap: 2, flexDirection: "row" }}>
            {priorities.map((p) => (
              <ReminderRadioButton
                key={p.id}
                testId={`priority-${p.id}`}
                label={strings.reminderNotificationModes(p.title)}
                selected={p.id === priority}
                onClick={() => setPriority(p.id)}
              />
            ))}
          </Flex>
        </Fieldset>

        <Flex sx={{ my: "spacing7" }}>
          <Text sx={{ color: "paragraph", fontSize: "xs" }}>
            {mode === Modes.REPEAT
              ? getReminderRepeatText(
                  recurringMode,
                  selectedDays,
                  date,
                  weekDays
                )
              : strings.reminderStarts(
                  date.format(db.settings.getDateFormat()),
                  date.format(timeFormat())
                )}
          </Text>
        </Flex>

        {reminder &&
        referencedNotes &&
        referencedNotes.status === "fulfilled" &&
        referencedNotes.value !== null &&
        referencedNotes.value.length > 0 ? (
          <Flex
            testID="reminder-note-references"
            sx={{
              mb: "spacing7",
              gap: "spacing4",
              flexDirection: "column"
            }}
          >
            <Text
              sx={{
                color: "paragraph-secondary",
                lineHeight: 1.2,
                fontSize: "xs"
              }}
            >
              {strings.noteReference()}
            </Text>
            {referencedNotes.value.map((item) => (
              <NoteReference
                key={item.id}
                item={item}
                date={item.dateCreated}
                sx={{
                  borderRadius: "radius2",
                  border: "1px solid",
                  borderColor: "border",
                  bg: "background"
                }}
              />
            ))}
          </Flex>
        ) : null}
      </Dialog>
    );
  },
  {
    onBeforeOpen: (props) =>
      props.reminder ? true : checkFeature("activeReminders")
  }
);

function timeFormat() {
  return getTimeFormat(db.settings.getTimeFormat());
}

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const WEEK_DAYS_MON = [1, 2, 3, 4, 5, 6, 0] as const;

export function getWeekDays(weekFormat: string) {
  return (weekFormat === "Sun" ? WEEK_DAYS : WEEK_DAYS_MON).map((day) =>
    strings.weekDayNamesShort[day]()
  );
}

function getMonthNames() {
  const formatter = new Intl.DateTimeFormat(i18n.locale || undefined, {
    month: "long"
  });
  return Array.from({ length: 12 }, (_, month) =>
    formatter.format(new Date(2000, month, 1))
  );
}

export function getReminderRepeatText(
  recurringMode: ValueOf<typeof RecurringModes>,
  selectedDays: number[],
  date: Dayjs,
  weekDays: string[]
) {
  const time = date.format(timeFormat());

  if (recurringMode === RecurringModes.YEAR) {
    return strings.reminderRepeatStrings.year(
      `${date.format(db.settings.getDateFormat())} at ${time}`
    );
  }

  const repeatsDaily =
    (selectedDays.length === 7 && recurringMode === RecurringModes.WEEK) ||
    (selectedDays.length === 31 && recurringMode === RecurringModes.MONTH) ||
    recurringMode === RecurringModes.DAY;

  if (selectedDays.length === 0 && recurringMode !== RecurringModes.DAY)
    return recurringMode === RecurringModes.WEEK
      ? strings.reminderRepeatStrings.week.selectDays()
      : strings.reminderRepeatStrings.month.selectDays();

  if (repeatsDaily) return strings.reminderRepeatStrings.day(time);

  return strings.reminderRepeatStrings.repeats(
    1,
    recurringMode,
    getSelectedDaysText(selectedDays, recurringMode, weekDays),
    time
  );
}

function getSelectedDaysText(
  selectedDays: number[],
  recurringMode: ValueOf<typeof RecurringModes>,
  weekDays: string[]
) {
  return [...selectedDays]
    .sort((a, b) => a - b)
    .map((day, index) => {
      const isLast = index === selectedDays.length - 1;
      const isSecondLast = index === selectedDays.length - 2;
      const joinWith = isSecondLast ? " & " : isLast ? "" : ", ";
      return recurringMode === RecurringModes.WEEK
        ? weekDays[day] + joinWith
        : `${day}${nth(day)} ${joinWith}`;
    })
    .join("");
}

function nth(n: number) {
  return (
    ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
    "th"
  );
}

type ReminderSelectProps = {
  label: string;
  id: string;
  options: { value: string; title: string }[];
  value: string;
  onSelectionChanged: (value: string) => void;
};

function ReminderSelect(props: ReminderSelectProps) {
  const { id, label, options, value, onSelectionChanged } = props;

  return (
    <Flex
      sx={{
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        gap: "spacing4"
      }}
    >
      <Text
        sx={{
          color: "paragraph-secondary",
          fontSize: "xs",
          lineHeight: 1.2
        }}
      >
        {label}
      </Text>
      <Select
        id={id}
        testID={id}
        options={options}
        value={value}
        onChange={onSelectionChanged}
        sx={{ height: 45 }}
      />
    </Flex>
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
