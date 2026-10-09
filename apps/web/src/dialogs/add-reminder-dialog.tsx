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

import NoteItem from "../components/note";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { Box, Button, Flex, Label, Text } from "@theme-ui/components";
import { ThemeUIStyleObject } from "@theme-ui/css";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useRef, useState } from "react";
import { db } from "../common/db";
import { useStore } from "../stores/reminder-store";
import { useStore as useSettingsStore } from "../stores/setting-store";
import { showToast } from "../utils/toast";
import { CalendarDots, CaretDown, Clock, Pro } from "../components/icons";
import { usePersistentState } from "../hooks/use-persistent-state";
import { DayPicker } from "../components/day-picker";
import { PopupPresenter } from "@notesnook/ui";
import type { MenuItem } from "@notesnook/ui";
import { useStore as useThemeStore } from "../stores/theme-store";
import { useMenuTrigger } from "../hooks/use-menu";
import {
  getFormattedDate,
  useIsFeatureAvailable,
  usePromise
} from "@notesnook/common";
import { MONTHS_FULL, getTimeFormat } from "@notesnook/core";
import { Note, Reminder } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { checkFeature } from "../common";
import { setTimeOnly, setDateOnly } from "../utils/date-time";
import Skeleton from "react-loading-skeleton";

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
    const [title, setTitle] = useState<string>(
      note?.title ?? reminder?.title ?? ""
    );
    const [description, setDescription] = useState<string>(
      note?.headline ?? reminder?.description ?? ""
    );
    const [showCalendar, setShowCalendar] = useState(false);
    const [showMonthlyDays, setShowMonthlyDays] = useState(false);
    const refresh = useStore((state) => state.refresh);
    const theme = useThemeStore((store) => store.colorScheme);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const monthlyDaysRef = useRef<HTMLButtonElement>(null);
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

    return (
      <Dialog
        isOpen={true}
        title={reminder ? strings.editReminder() : strings.newReminder()}
        testId="add-reminder-dialog"
        onClose={() => props.onClose(false)}
        sx={{ fontFamily: "body" }}
        width={700}
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

            if (mode !== Modes.REPEAT && date.isAfter(MAX_DATE)) {
              showToast(
                "error",
                strings.maximumReminderDate(getFormattedDate(MAX_DATE, "date"))
              );
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
        <ReminderSection title="Reminder details">
          <Flex sx={{ gap: "spacing6", flexDirection: "column" }}>
            <Field
              id="title"
              label={strings.title()}
              required
              value={title}
              placeholder="What needs to be done?"
              data-test-id="title-input"
              styles={{
                input: {
                  height: "45px",
                  fontSize: "sm",
                  px: "spacing4",
                  py: "spacing6"
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
            />
            <Field
              as="textarea"
              id="description"
              label={`${strings.description()} (${strings.optional()})`}
              data-test-id="description-input"
              placeholder="Add some details"
              value={description}
              styles={{
                input: {
                  height: "100px",
                  resize: "both",
                  fontSize: "sm",
                  px: "spacing4",
                  py: "spacing6"
                },
                helpText: {
                  fontSize: "xs"
                }
              }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDescription(e.target.value)
              }
            />
          </Flex>
        </ReminderSection>
        <ReminderSection title="Repeat">
          <Flex sx={{ gap: "spacing4", alignItems: "center" }}>
            {modes.map((m) => (
              <ReminderRadioButton
                key={m.id}
                id={`mode-${m.id}`}
                name="mode"
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
                sx={{ width: "fit-content" }}
              />
            ))}
          </Flex>
          {mode === Modes.REPEAT ? (
            <>
              <Flex
                sx={{
                  alignItems: "center",
                  gap: "spacing4",
                  mt: "spacing6",
                  justifyContent: "space-between"
                }}
              >
                {recurringModes.map((mode) => (
                  <ReminderRadioButton
                    key={mode.id}
                    id={`recurring-mode-${mode.id}`}
                    name={`recurring-mode-${mode.id}`}
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
            </>
          ) : null}
        </ReminderSection>

        <ReminderSection title="Schedule">
          <Flex
            sx={{
              gap: "spacing6",
              flexDirection: "row"
            }}
          >
            {mode === Modes.ONCE ? (
              <>
                <Field
                  id="date"
                  label="Select date"
                  required
                  inputRef={dateInputRef}
                  data-test-id="date-input"
                  placeholder={`${db.settings.getDateFormat()}`}
                  action={{
                    icon: CalendarDots,
                    onClick() {
                      setShowCalendar(true);
                    }
                  }}
                  sx={{ flex: 1 }}
                  styles={{
                    input: {
                      height: "45px",
                      fontSize: "sm",
                      px: "spacing4",
                      py: "spacing6"
                    }
                  }}
                  validate={(t) =>
                    dayjs(t, db.settings.getDateFormat(), true).isValid()
                  }
                  defaultValue={date.format(db.settings.getDateFormat())}
                  onChange={(e) =>
                    setDate((d) => setDateOnly(e.target.value, d))
                  }
                />
                <PopupPresenter
                  isOpen={showCalendar}
                  onClose={() => setShowCalendar(false)}
                  position={{
                    isTargetAbsolute: true,
                    target: dateInputRef.current,
                    location: "below",
                    yOffset: 10
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
                    maxDate={MAX_DATE}
                    onSelect={(day) => {
                      if (!day) return;
                      const date = getFormattedDate(day, "date");
                      setDate((d) => setDateOnly(date, d));
                      if (dateInputRef.current)
                        dateInputRef.current.value = date;
                    }}
                  />
                </PopupPresenter>
              </>
            ) : recurringMode === RecurringModes.YEAR ? (
              <Flex sx={{ flex: 1, gap: "spacing6" }}>
                <ReminderSelect
                  id="month"
                  label="Select month"
                  value={`${dayjs(date).month()}`}
                  options={MONTHS_FULL.map((month, index) => ({
                    value: `${index}`,
                    title: month
                  }))}
                  onSelectionChanged={(month) => {
                    setDate((d) => d.month(parseInt(month)));
                  }}
                />
                <ReminderSelect
                  id="day"
                  label="Select date"
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
                  action={CalendarDots}
                />
              </Flex>
            ) : null}
            {mode === Modes.REPEAT && recurringMode === RecurringModes.MONTH ? (
              <>
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
                    Select day
                  </Text>
                  <Button
                    ref={monthlyDaysRef}
                    variant="secondary"
                    onClick={() => setShowMonthlyDays(true)}
                    sx={{
                      display: "flex",
                      flex: 1,
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderRadius: "radius2",
                      px: "spacing4",
                      py: "spacing6",
                      bg: "background-secondary",
                      color: "paragraph",
                      fontSize: "sm"
                    }}
                  >
                    {selectedDays.length
                      ? `${selectedDays.length} ${
                          selectedDays.length === 1 ? "day" : "days"
                        } of every month`
                      : "Select day"}
                    <CaretDown size={13} color="icon" />
                  </Button>
                </Flex>
                <PopupPresenter
                  isOpen={showMonthlyDays}
                  onClose={() => setShowMonthlyDays(false)}
                  position={{
                    isTargetAbsolute: true,
                    target: monthlyDaysRef.current,
                    location: "below",
                    yOffset: 10
                  }}
                  sx={{
                    width: "307px",
                    px: "spacing3",
                    py: "spacing6",
                    display: "grid",
                    gridTemplateColumns: "repeat(7, 1fr)",
                    rowGap: "spacing6",
                    bg: "background",
                    border: "1px solid",
                    borderColor: "border",
                    borderRadius: "radius2",
                    boxShadow: "0px 5px 20px 0px rgba(0, 0, 0, 0.14)"
                  }}
                >
                  {new Array(30).fill(0).map((_, index) => {
                    const day = index + 1;
                    const selected = selectedDays.includes(day);
                    return (
                      <Button
                        key={day}
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
                          width: "38.3px",
                          height: "29px",
                          p: 0,
                          borderRadius: "radius1",
                          bg: selected ? "background-selected" : "transparent",
                          color: selected ? "paragraph-selected" : "paragraph",
                          fontSize: "sm"
                        }}
                      >
                        {day}
                      </Button>
                    );
                  })}
                </PopupPresenter>
              </>
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
                  Select days
                </Text>
                <Flex sx={{ gap: "spacing3", alignItems: "stretch", flex: 1 }}>
                  {recurringModes
                    .find((item) => item.id === RecurringModes.WEEK)
                    ?.options.map((day, i) => (
                      <Button
                        key={day}
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
                          flex: 1,
                          minWidth: 0,
                          height: "auto",
                          border: "1px solid",
                          borderColor: selectedDays.includes(day)
                            ? "transparent"
                            : "border",
                          borderRadius: "radius2",
                          px: "spacing4",
                          py: "spacing4",
                          bg: selectedDays.includes(day)
                            ? "background-selected"
                            : "transparent",
                          color: selectedDays.includes(day)
                            ? "paragraph-selected"
                            : "paragraph",
                          fontSize: "sm",
                          fontWeight: selectedDays.includes(day) ? 500 : "body",
                          lineHeight: 1
                        }}
                      >
                        {weekDays[i][0]}
                      </Button>
                    ))}
                </Flex>
              </Flex>
            ) : null}
            <Field
              id="time"
              label={"Enter time"}
              required
              data-test-id="time-input"
              sx={{
                flex: 1,
                alignSelf: "flex-start"
              }}
              action={{ icon: Clock }}
              placeholder={
                db.settings.getTimeFormat() === "12-hour"
                  ? "hh:mm AM/PM"
                  : "hh:mm"
              }
              styles={{
                input: {
                  height: "45px",
                  fontSize: "sm",
                  px: "spacing4",
                  py: "spacing6"
                }
              }}
              validate={(t) => {
                const format =
                  db.settings.getTimeFormat() === "12-hour"
                    ? "hh:mm a"
                    : "HH:mm";
                return dayjs(t.toLowerCase(), format, true).isValid();
              }}
              defaultValue={date.format(
                getTimeFormat(db.settings.getTimeFormat())
              )}
              onChange={(e) => setDate((d) => setTimeOnly(e.target.value, d))}
            />
          </Flex>
        </ReminderSection>
        <ReminderSection title="Alert mode">
          <Flex sx={{ gap: 2 }}>
            {priorities.map((p) => (
              <ReminderRadioButton
                key={p.id}
                id={`priority-${p.id}`}
                name="priority"
                testId={`priority-${p.id}`}
                label={strings.reminderNotificationModes(p.title)}
                selected={p.id === priority}
                onClick={() => setPriority(p.id)}
              />
            ))}
          </Flex>
        </ReminderSection>

        <Box sx={{ my: "spacing7" }}>
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
        </Box>

        {reminder ? (
          referencedNotes && referencedNotes.status === "fulfilled" ? (
            referencedNotes.value !== null &&
            referencedNotes.value.length > 0 && (
              <Flex
                data-test-id="reminder-note-references"
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
                  {strings.note()} {strings.references()}:
                </Text>
                {referencedNotes.value.map((item) => (
                  <NoteItem
                    key={item.id}
                    item={item}
                    date={item.dateCreated}
                    compact
                  />
                ))}
              </Flex>
            )
          ) : (
            <Skeleton count={1} />
          )
        ) : null}
      </Dialog>
    );
  },
  {
    onBeforeOpen: (props) =>
      props.reminder ? true : checkFeature("activeReminders")
  }
);

type ReminderSectionProps = {
  title: string;
  children: React.ReactNode;
};

function ReminderSection(props: ReminderSectionProps) {
  const { title, children } = props;

  return (
    <Box
      as="fieldset"
      sx={{
        position: "relative",
        mt: "spacing7",
        p: "spacing6",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius3"
      }}
    >
      <Text
        as="legend"
        sx={{
          px: "spacing1",
          color: "accent",
          fontSize: "xs",
          fontWeight: 500,
          lineHeight: 1.2
        }}
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

type ReminderRadioButtonProps = {
  id: string;
  name: string;
  testId: string;
  label: string;
  selected: boolean;
  premium?: boolean;
  sx?: ThemeUIStyleObject;
  onClick: () => void;
};

function ReminderRadioButton(props: ReminderRadioButtonProps) {
  const { id, name, testId, label, selected, premium, sx, onClick } = props;

  return (
    <Button
      data-test-id={testId}
      onClick={premium ? undefined : onClick}
      sx={{
        minWidth: 0,
        border: "1px solid",
        borderColor: selected ? "transparent" : "border",
        borderRadius: "radius2",
        py: "spacing5",
        px: "spacing4",
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        bg: selected ? "background-selected" : "transparent",
        gap: "spacing4",
        ...sx
      }}
    >
      {premium && <Pro size={13} />}
      <Text
        sx={{
          color: selected ? "paragraph-selected" : "paragraph",
          fontWeight: selected ? 500 : 400,
          fontSize: "sm",
          lineHeight: 1
        }}
      >
        {label}
      </Text>
      <CustomRadio
        id={id}
        name={name}
        checked={selected}
        onChange={premium ? undefined : onClick}
      />
    </Button>
  );
}

type CustomRadioProps = {
  id: string;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
};

function CustomRadio(props: CustomRadioProps) {
  const { id, name, checked, disabled, onChange } = props;

  return (
    <input
      type="radio"
      id={id}
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        flexShrink: 0,
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: checked
          ? "1px solid var(--accent)"
          : "1px solid var(--paragraph)",
        background: checked ? "var(--accent)" : "none",
        boxShadow: checked ? "inset 0 0 0 3px var(--background)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        margin: 0
      }}
    />
  );
}

function timeFormat() {
  return getTimeFormat(db.settings.getTimeFormat());
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function getWeekDays(weekFormat: string) {
  return weekFormat === "Sun" ? WEEK_DAYS : WEEK_DAYS_MON;
}

export function getReminderRepeatText(
  recurringMode: ValueOf<typeof RecurringModes>,
  selectedDays: number[],
  date: Dayjs,
  weekDays: string[]
) {
  const time = date.format(timeFormat());
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
  action?: typeof CalendarDots;
  onSelectionChanged: (value: string) => void;
};

function ReminderSelect(props: ReminderSelectProps) {
  const { id, label, options, value, action, onSelectionChanged } = props;
  const ActionIcon = action || CaretDown;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { openMenu } = useMenuTrigger();
  const selectedTitle =
    options.find((o) => o.value === value)?.title ?? options[0]?.title;

  return (
    <Flex
      sx={{
        flex: 1,
        minWidth: 0,
        flexDirection: "column",
        gap: "spacing4"
      }}
    >
      <Label
        htmlFor={id}
        sx={{
          color: "paragraph-secondary",
          fontSize: "xs",
          lineHeight: 1.2
        }}
      >
        {label}
      </Label>
      <Button
        id={id}
        ref={buttonRef}
        variant="secondary"
        onClick={() => {
          const items: MenuItem[] = options.map((o) => ({
            type: "button",
            key: o.value,
            title: o.title,
            isChecked: o.value === value,
            onClick: () => onSelectionChanged(o.value)
          }));
          openMenu(items, {
            position: {
              target: buttonRef.current,
              isTargetAbsolute: true,
              location: "below"
            }
          });
        }}
        sx={{
          height: "45px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "radius2",
          px: "spacing4",
          py: "spacing5",
          bg: "background-secondary",
          color: "paragraph",
          fontSize: "sm"
        }}
      >
        {selectedTitle}
        <ActionIcon size={15} color="icon" />
      </Button>
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
