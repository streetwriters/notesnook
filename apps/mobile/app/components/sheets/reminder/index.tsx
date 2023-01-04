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
import React, { RefObject, useRef, useState } from "react";
import { Platform, ScrollView, View, TextInput } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  presentSheet,
  PresentSheetOptions,
  ToastEvent
} from "../../../services/event-manager";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import Input from "../../ui/input";

import { formatReminderTime } from "@notesnook/core/collections/reminders";
import dayjs from "dayjs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import Navigation from "../../../services/navigation";
import Notifications, { Reminder } from "../../../services/notifications";
import { useRelationStore } from "../../../stores/use-relation-store";
import Paragraph from "../../ui/typography/paragraph";
import PremiumService from "../../../services/premium";
type ReminderSheetProps = {
  actionSheetRef: RefObject<ActionSheet>;
  close?: (ctx?: string) => void;
  update?: (options: PresentSheetOptions) => void;
  reminder?: Reminder;
  reference?: { id: string; type: string };
};

const ReminderModes =
  Platform.OS === "ios"
    ? {
        Once: "once",
        Repeat: "repeat"
      }
    : {
        Once: "once",
        Repeat: "repeat",
        Permanent: "permanent"
      };

const RecurringModes = {
  Daily: "day",
  Week: "week",
  Month: "month"
};
const WeekDays = new Array(7).fill(true);
const MonthDays = new Array(31).fill(true);
const WeekDayNames = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday"
};

const ReminderNotificationModes = {
  Silent: "silent",
  Vibrate: "vibrate",
  Urgent: "urgent"
};

export default function ReminderSheet({
  actionSheetRef,
  close,
  update,
  reminder,
  reference
}: ReminderSheetProps) {
  const colors = useThemeStore((state) => state.colors);
  const [reminderMode, setReminderMode] = useState<Reminder["mode"]>(
    reminder?.mode || "once"
  );
  const [recurringMode, setRecurringMode] = useState<Reminder["recurringMode"]>(
    reminder?.recurringMode || "week"
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    reminder?.selectedDays || []
  );
  const [date, setDate] = useState<Date>(
    new Date(reminder?.date || Date.now())
  );
  const [time, setTime] = useState<string>(
    dayjs(reminder?.date || Date.now()).format("hh:mm a")
  );
  const [reminderNotificationMode, setReminderNotificatioMode] = useState<
    Reminder["priority"]
  >(reminder?.priority || "silent");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState(1);
  const title = useRef<string | undefined>(reminder?.title);
  const details = useRef<string | undefined>(reminder?.description);
  const titleRef = useRef<TextInput>(null);
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
    setTimePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    hideDatePicker();
    setTime(dayjs(date).format("hh:mm a"));
    setDate(date);
  };
  function nth(n: number) {
    return (
      ["st", "nd", "rd"][(((((n < 0 ? -n : n) + 90) % 100) - 10) % 10) - 1] ||
      "th"
    );
  }

  function getSelectedDaysText(selectedDays: number[]) {
    const text = selectedDays
      .sort((a, b) => a - b)
      .map((day, index) => {
        const isLast = index === selectedDays.length - 1;
        const isSecondLast = index === selectedDays.length - 2;
        const joinWith = isSecondLast ? " & " : isLast ? "" : ", ";
        return recurringMode === RecurringModes.Week
          ? WeekDayNames[day as keyof typeof WeekDayNames] + joinWith
          : `${day}${nth(day)} ${joinWith}`;
      })
      .join("");
    return text;
  }

  async function saveReminder() {
    if (!(await Notifications.checkAndRequestPermissions())) return;
    if (!date && reminderMode !== ReminderModes.Permanent) return;
    if (!title.current) {
      ToastEvent.show({
        heading: "Please set title of the reminder",
        type: "error",
        context: "local"
      });
      return;
    }
    if (date.getTime() < Date.now()) {
      ToastEvent.show({
        heading: "Reminder date must be set in future",
        type: "error",
        context: "local"
      });
      titleRef?.current?.focus();
      return;
    }

    date.setSeconds(0, 0);

    const reminderId = await db.reminders?.add({
      id: reminder?.id,
      date: date?.getTime(),
      priority: reminderNotificationMode,
      title: title.current,
      description: details.current,
      recurringMode: recurringMode,
      selectedDays: selectedDays,
      mode: reminderMode,
      localOnly: reminderMode === "permanent",
      snoozeUntil:
        date?.getTime() > Date.now() ? undefined : reminder?.snoozeUntil
    });

    const _reminder = db.reminders?.reminder(reminderId);

    if (!_reminder) {
      ToastEvent.show({
        heading: "Failed to add a new reminder"
      });
    }
    if (reference) {
      db.relations?.add(reference, {
        id: _reminder?.id as string,
        type: _reminder?.type as string
      });
    }
    Notifications.scheduleNotification(_reminder as Reminder);
    useRelationStore.getState().update();
    Navigation.queueRoutesForUpdate(
      "TaggedNotes",
      "ColoredNotes",
      "Notes",
      "NotesPage",
      "Reminders",
      "Favorites",
      "TopicNotes"
    );
    close?.("local");
    close?.();
  }

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}
    >
      <Input
        fwdRef={titleRef}
        defaultValue={reminder?.title}
        placeholder="Remind me of..."
        onChangeText={(text) => (title.current = text)}
        containerStyle={{ borderWidth: 0, borderBottomWidth: 1 }}
      />

      <Input
        defaultValue={reminder?.description}
        placeholder="Add a quick note"
        onChangeText={(text) => (details.current = text)}
        containerStyle={{ borderWidth: 0, borderBottomWidth: 1 }}
      />

      <View
        style={{
          flexDirection: "row",
          marginBottom: 12
        }}
      >
        {Object.keys(ReminderModes).map((mode) => (
          <Button
            key={mode}
            title={mode}
            style={{
              marginRight: 12,
              borderRadius: 100,
              minWidth: 70
            }}
            proTag={mode === "Repeat"}
            height={35}
            type={
              reminderMode === ReminderModes[mode as keyof typeof ReminderModes]
                ? "grayAccent"
                : "gray"
            }
            onPress={() => {
              if (mode === "Repeat" && !PremiumService.get()) return;
              setReminderMode(
                ReminderModes[
                  mode as keyof typeof ReminderModes
                ] as Reminder["mode"]
              );
            }}
          />
        ))}
      </View>

      {reminderMode === ReminderModes.Repeat ? (
        <View
          style={{
            backgroundColor: colors.nav,
            padding: 12,
            borderRadius: 5,
            marginBottom: 12
          }}
        >
          <View
            style={{
              flexDirection: "row",
              marginBottom: recurringMode === "day" ? 0 : 12,
              alignItems: "center"
            }}
          >
            {Object.keys(RecurringModes).map((mode) => (
              <Button
                key={mode}
                title={
                  !repeatFrequency || repeatFrequency <= 1 ? mode : mode + "s"
                }
                style={{
                  marginRight: 6,
                  borderRadius: 100
                }}
                height={35}
                type={
                  recurringMode ===
                  RecurringModes[mode as keyof typeof RecurringModes]
                    ? "grayAccent"
                    : "gray"
                }
                onPress={() => {
                  setRecurringMode(
                    RecurringModes[
                      mode as keyof typeof RecurringModes
                    ] as Reminder["recurringMode"]
                  );
                  setSelectedDays([]);
                  setRepeatFrequency(1);
                }}
              />
            ))}
          </View>

          <ScrollView showsHorizontalScrollIndicator={false} horizontal>
            {recurringMode === RecurringModes.Daily
              ? null
              : recurringMode === RecurringModes.Week
              ? WeekDays.map((item, index) => (
                  <Button
                    key={WeekDayNames[index as keyof typeof WeekDayNames]}
                    title={WeekDayNames[
                      index as keyof typeof WeekDayNames
                    ].slice(0, 1)}
                    type={selectedDays.indexOf(index) > -1 ? "accent" : "gray"}
                    fontSize={SIZE.sm - 1}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 100,
                      marginRight: 10,
                      backgroundColor:
                        selectedDays.indexOf(index) > -1
                          ? colors.accent
                          : colors.bg
                    }}
                    onPress={() => {
                      setSelectedDays((days) => {
                        if (days.indexOf(index) > -1) {
                          days.splice(days.indexOf(index), 1);
                          return [...days];
                        }
                        days.push(index);
                        return [...days];
                      });
                    }}
                  />
                ))
              : MonthDays.map((item, index) => (
                  <Button
                    key={index + "monthday"}
                    title={index + 1 + ""}
                    type={
                      selectedDays.indexOf(index + 1) > -1 ? "accent" : "gray"
                    }
                    fontSize={SIZE.sm - 1}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 100,
                      marginRight: 10,
                      backgroundColor:
                        selectedDays.indexOf(index + 1) > -1
                          ? colors.accent
                          : colors.bg
                    }}
                    onPress={() => {
                      setSelectedDays((days) => {
                        if (days.indexOf(index + 1) > -1) {
                          days.splice(days.indexOf(index + 1), 1);
                          return [...days];
                        }
                        days.push(index + 1);
                        return [...days];
                      });
                    }}
                  />
                ))}
          </ScrollView>
        </View>
      ) : null}

      {reminderMode === ReminderModes.Permanent ? null : (
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12
          }}
        >
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            date={date || new Date(Date.now())}
          />

          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
            date={date || new Date(Date.now())}
          />

          {reminderMode === ReminderModes.Repeat ? null : (
            <Button
              style={{
                width: "48.5%"
              }}
              title={date ? date.toLocaleDateString() : "Select date"}
              type={date ? "grayAccent" : "grayBg"}
              icon="calendar"
              onPress={() => {
                showDatePicker();
              }}
            />
          )}

          <Button
            style={{
              width: reminderMode === ReminderModes.Repeat ? "100%" : "48.5%"
            }}
            title={time || "Select time"}
            type={time ? "grayAccent" : "grayBg"}
            icon="clock"
            onPress={() => {
              showTimePicker();
            }}
          />
        </View>
      )}

      {reminderMode === ReminderModes.Permanent ? null : (
        <View
          style={{
            flexDirection: "row",
            marginBottom: 12
          }}
        >
          {Object.keys(ReminderNotificationModes).map((mode) => (
            <Button
              key={mode}
              title={mode}
              style={{
                marginRight: 12,
                borderRadius: 100
              }}
              icon={
                mode === "Silent"
                  ? "minus-circle"
                  : mode === "Vibrate"
                  ? "vibrate"
                  : "volume-high"
              }
              height={35}
              type={
                reminderNotificationMode ===
                ReminderNotificationModes[
                  mode as keyof typeof ReminderNotificationModes
                ]
                  ? "grayAccent"
                  : "gray"
              }
              onPress={() => {
                setReminderNotificatioMode(
                  ReminderNotificationModes[
                    mode as keyof typeof ReminderNotificationModes
                  ] as Reminder["priority"]
                );
              }}
            />
          ))}
        </View>
      )}
      {reminderMode === ReminderModes.Once ||
      reminderMode === ReminderModes.Permanent ? null : (
        <View
          style={{
            borderRadius: 5,
            flexDirection: "row",
            paddingVertical: 6,
            paddingHorizontal: 12,
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: 10,
            backgroundColor: colors.nav
          }}
        >
          <>
            <Paragraph size={SIZE.xs + 1} color={colors.icon}>
              {recurringMode === RecurringModes.Daily
                ? "Repeats daily " + `at ${dayjs(date).format("hh:mm A")}.`
                : selectedDays.length === 7 &&
                  recurringMode === RecurringModes.Week
                ? `The reminder will repeat daily at ${dayjs(date).format(
                    "hh:mm A"
                  )}.`
                : selectedDays.length === 0
                ? recurringMode === RecurringModes.Week
                  ? "Select day of the week to repeat the reminder."
                  : "Select nth day of the month to repeat the reminder."
                : `Repeats every${
                    repeatFrequency > 1 ? " " + repeatFrequency : ""
                  } ${
                    repeatFrequency > 1 ? recurringMode + "s" : recurringMode
                  } on ${getSelectedDaysText(selectedDays)} at ${dayjs(
                    date
                  ).format("hh:mm A")}.`}
            </Paragraph>
          </>
        </View>
      )}

      {reminder && reminder.date ? (
        <View
          style={{
            borderRadius: 5,
            flexDirection: "row",
            paddingVertical: 6,
            paddingHorizontal: 12,
            alignItems: "center",
            justifyContent: "flex-start",
            marginBottom: 10,
            backgroundColor: colors.nav
          }}
        >
          <>
            <Icon name="clock-outline" size={SIZE.md} color={colors.accent} />
            <Paragraph
              size={SIZE.xs + 1}
              color={colors.icon}
              style={{ marginLeft: 5 }}
            >
              {formatReminderTime(reminder)}
            </Paragraph>
          </>
        </View>
      ) : null}

      <Button
        style={{
          width: "100%"
        }}
        title="Save"
        type="accent"
        onPress={saveReminder}
      />
    </View>
  );
}

ReminderSheet.present = (
  reminder?: Reminder,
  reference?: { id: string; type: string },
  isSheet?: boolean
) => {
  presentSheet({
    context: isSheet ? "local" : undefined,
    component: (ref, close, update) => (
      <ReminderSheet
        actionSheetRef={ref}
        close={close}
        update={update}
        reminder={reminder}
        reference={reference}
      />
    )
  });
};
