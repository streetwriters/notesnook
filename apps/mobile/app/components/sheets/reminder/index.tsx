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
import { Platform, ScrollView, View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  presentSheet,
  PresentSheetOptions
} from "../../../services/event-manager";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import Input from "../../ui/input";

import Notifications, { Reminder } from "../../../services/notifications";

type ReminderSheetProps = {
  actionSheetRef: RefObject<ActionSheet>;
  close?: () => void;
  update?: (options: PresentSheetOptions) => void;
  reminder?: Reminder;
};

const ReminderModes =
  Platform.OS === "ios"
    ? {
        Once: "once",
        Recurring: "recurring"
      }
    : {
        Once: "once",
        Recurring: "recurring",
        Permanent: "permanent"
      };

const RecurringModes = {
  Weekly: "weekly",
  Monthly: "monthly"
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
  reminder
}: ReminderSheetProps) {
  const colors = useThemeStore((state) => state.colors);
  const [reminderMode, setReminderMode] = useState<string | undefined>(
    ReminderModes.Once
  );
  const [recurringMode, setRecurringMode] = useState(RecurringModes.Weekly);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [reminderNotificationMode, setReminderNotificatioMode] = useState(
    ReminderNotificationModes.Silent
  );
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const title = useRef<string>();
  const details = useRef<string>();

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
    setTime(new Date(date).toLocaleTimeString());
    setDate(date);
    hideDatePicker();
  };

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}
    >
      <Input
        defaultValue={reminder?.title}
        placeholder="Remind me of..."
        onChangeText={(text) => (title.current = text)}
        containerStyle={{ borderWidth: 0, borderBottomWidth: 1 }}
      />

      <Input
        defaultValue={reminder?.details}
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
            height={35}
            type={
              reminderMode === ReminderModes[mode as keyof typeof ReminderModes]
                ? "grayAccent"
                : "gray"
            }
            onPress={() => {
              setReminderMode(
                ReminderModes[mode as keyof typeof ReminderModes]
              );
            }}
          />
        ))}
      </View>

      {reminderMode === ReminderModes.Recurring ? (
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
              marginBottom: 12
            }}
          >
            {Object.keys(RecurringModes).map((mode) => (
              <Button
                key={mode}
                title={mode}
                style={{
                  marginRight: 12,
                  borderRadius: 100
                }}
                height={35}
                type={
                  recurringMode ===
                  RecurringModes[mode as keyof typeof RecurringModes]
                    ? "accent"
                    : "gray"
                }
                onPress={() => {
                  setRecurringMode(
                    RecurringModes[mode as keyof typeof RecurringModes]
                  );
                  setSelectedDays([]);
                }}
              />
            ))}
          </View>

          <ScrollView horizontal>
            {recurringMode === RecurringModes.Weekly
              ? WeekDays.map((item, index) => (
                  <Button
                    key={WeekDayNames[index as keyof typeof WeekDayNames]}
                    title={WeekDayNames[
                      index as keyof typeof WeekDayNames
                    ].slice(0, 3)}
                    type={selectedDays.indexOf(index) > -1 ? "shade" : "gray"}
                    fontSize={SIZE.sm - 1}
                    style={{
                      width: 65,
                      borderRadius: 100,
                      marginRight: 10
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
                    type={selectedDays.indexOf(index) > -1 ? "shade" : "gray"}
                    fontSize={SIZE.sm - 1}
                    style={{
                      width: 50,
                      borderRadius: 100,
                      marginRight: 10
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

          {reminderMode === ReminderModes.Recurring ? null : (
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
              width: reminderMode === ReminderModes.Recurring ? "100%" : "48.5%"
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
                  ]
                );
              }}
            />
          ))}
        </View>
      )}

      <Button
        style={{
          width: "100%"
        }}
        title="Save"
        type="accent"
        onPress={async () => {
          if (!(await Notifications.checkAndRequestPermissions())) return;
          if (
            (!date && reminderMode !== ReminderModes.Permanent) ||
            !title.current
          )
            return;
          Notifications.scheduleNotification({
            id: "test_1",
            type: "reminder",
            date: date?.getTime(),
            dateCreated: Date.now(),
            dateModified: Date.now(),
            priority: reminderNotificationMode as any,
            title: title.current,
            details: details.current,
            recurringMode: recurringMode as any,
            selectedDays: selectedDays,
            mode: reminderMode as any
          });
        }}
      />
    </View>
  );
}

ReminderSheet.present = (reminder: Reminder) => {
  presentSheet({
    component: (ref, close, update) => (
      <ReminderSheet
        actionSheetRef={ref}
        close={close}
        update={update}
        reminder={reminder}
      />
    )
  });
};
