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
import { Note, Reminder } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View
} from "react-native";
import DatePicker from "react-native-date-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../common/database";
import { Dialog } from "../../components/dialog";
import { Header } from "../../components/header";
import { Button } from "../../components/ui/button";
import Input from "../../components/ui/input";
import { ReminderTime } from "../../components/ui/reminder-time";
import Paragraph from "../../components/ui/typography/paragraph";
import { DDS } from "../../services/device-detection";
import { ToastManager } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import Notifications from "../../services/notifications";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useRelationStore } from "../../stores/use-relation-store";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { getFormattedDate, useIsFeatureAvailable } from "@notesnook/common";
import PaywallSheet from "../../components/sheets/paywall";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";

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
  Month: "month",
  Year: "year"
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

export default function AddReminder(props: NavigationProps<"AddReminder">) {
  const { reminder, reference } = props.route.params;
  useNavigationFocus(props.navigation, { focusOnInit: true });
  const { colors, isDark } = useThemeColors();
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
  const [reminderNotificationMode, setReminderNotificatioMode] = useState<
    Reminder["priority"]
  >(reminder?.priority || SettingsService.get().reminderNotificationMode);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState(1);
  const referencedItem = reference ? (reference as Note) : null;
  const recurringReminderFeature = useIsFeatureAvailable("recurringReminders");

  const title = useRef<string | undefined>(
    !reminder ? referencedItem?.title : reminder?.title
  );
  const details = useRef<string | undefined>(
    !reminder ? referencedItem?.headline : reminder?.description
  );
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const timer = useRef<NodeJS.Timeout>();

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    timer.current = setTimeout(() => {
      hideDatePicker();
      setDate(date);
    }, 10);
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
    try {
      if (!(await Notifications.checkAndRequestPermissions(true)))
        throw new Error(strings.noNotificationPermission());
      if (!date && reminderMode !== ReminderModes.Permanent) return;
      if (
        reminderMode === ReminderModes.Repeat &&
        recurringMode !== "day" &&
        recurringMode !== "year" &&
        selectedDays.length === 0
      )
        throw new Error(strings.selectDayError());

      if (!title.current) throw new Error(strings.setTitleError());
      if (
        date.getTime() < Date.now() &&
        reminderMode === "once" &&
        !props.route.params.reminder
      ) {
        throw new Error(strings.dateError());
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
          date?.getTime() > Date.now() ? undefined : reminder?.snoozeUntil,
        disabled: false
      });
      if (!reminderId) return;
      const _reminder = await db.reminders?.reminder(reminderId);

      if (reference && _reminder) {
        await db.relations?.add(reference, {
          id: _reminder?.id as string,
          type: _reminder?.type
        });
      }
      Notifications.scheduleNotification(_reminder as Reminder);
      Navigation.queueRoutesForUpdate();
      useRelationStore.getState().update();
      Navigation.goBack();
    } catch (e) {
      ToastManager.error(e as Error, undefined);
    }
  }

  const KeyboardViewIOS = Platform.OS === "ios" ? KeyboardAvoidingView : View;

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.primary.background,
        flex: 1
      }}
    >
      <KeyboardViewIOS
        behavior="padding"
        style={{
          flex: 1
        }}
      >
        <Header
          title={reminder ? strings.editReminder() : strings.newReminder()}
          canGoBack
          rightButton={{
            name: "check",
            onPress: saveReminder
          }}
        />
        <Dialog context="local" />
        <ScrollView
          style={{
            marginBottom: DDS.isTab ? 25 : undefined,
            paddingHorizontal: DefaultAppStyles.GAP
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <Input
            fwdRef={titleRef}
            defaultValue={reminder?.title || referencedItem?.title}
            placeholder={strings.remindeMeOf()}
            onChangeText={(text) => (title.current = text)}
            autoFocus
            wrapperStyle={{
              marginTop: DefaultAppStyles.GAP_VERTICAL
            }}
            onSubmit={() => {
              descriptionRef.current?.focus();
            }}
          />

          <Input
            defaultValue={
              reminder ? reminder?.description : referencedItem?.headline
            }
            fwdRef={descriptionRef}
            placeholder={strings.addShortNote()}
            onChangeText={(text) => (details.current = text)}
            containerStyle={{
              maxHeight: 80
            }}
            multiline
            textAlignVertical="top"
            inputStyle={{
              minHeight: 80,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL
            }}
            height={80}
            wrapperStyle={{
              marginBottom: DefaultAppStyles.GAP_VERTICAL
            }}
          />

          <ScrollView
            style={{
              flexDirection: "row",
              marginBottom: DefaultAppStyles.GAP_VERTICAL
            }}
            horizontal
          >
            {Object.keys(ReminderModes).map((mode) => (
              <Button
                key={mode}
                title={strings.reminderModes(
                  ReminderModes[mode as keyof typeof ReminderModes] as string
                )}
                style={{
                  paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
                  marginRight: DefaultAppStyles.GAP_SMALL
                }}
                proTag={mode === "Repeat"}
                height={35}
                type={
                  reminderMode ===
                  ReminderModes[mode as keyof typeof ReminderModes]
                    ? "selectedAccent"
                    : "plain"
                }
                onPress={() => {
                  if (
                    recurringReminderFeature &&
                    !recurringReminderFeature?.isAllowed
                  ) {
                    PaywallSheet.present(recurringReminderFeature);
                    return;
                  }

                  setReminderMode(
                    ReminderModes[
                      mode as keyof typeof ReminderModes
                    ] as Reminder["mode"]
                  );
                  if (mode === "Repeat") {
                    setSelectedDays((days) => {
                      if (days.length > 0) return days;
                      if (days.indexOf(date.getDay()) > -1) {
                        return days;
                      }
                      days.push(date.getDay());
                      return [...days];
                    });
                  }
                }}
              />
            ))}
          </ScrollView>

          {reminderMode === ReminderModes.Repeat ? (
            <View
              style={{
                backgroundColor: colors.secondary.background,
                padding: DefaultAppStyles.GAP,
                borderRadius: defaultBorderRadius,
                marginBottom: DefaultAppStyles.GAP_VERTICAL
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  marginBottom:
                    recurringMode === "day" || recurringMode === "year"
                      ? 0
                      : 12,
                  alignItems: "center"
                }}
              >
                {Object.keys(RecurringModes).map((mode) => (
                  <Button
                    key={mode}
                    title={strings.recurringModes(
                      RecurringModes[mode as keyof typeof RecurringModes]
                    )}
                    style={{
                      marginRight: 6,
                      borderRadius: 100,
                      paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
                    }}
                    type={
                      recurringMode ===
                      RecurringModes[mode as keyof typeof RecurringModes]
                        ? "selected"
                        : "plain"
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
                {recurringMode === RecurringModes.Daily ||
                recurringMode === RecurringModes.Year
                  ? null
                  : recurringMode === RecurringModes.Week
                  ? WeekDays.map((item, index) => (
                      <Button
                        key={strings.weekDayNamesShort[
                          index as keyof typeof strings.weekDayNamesShort
                        ]()}
                        title={strings.weekDayNamesShort[
                          index as keyof typeof strings.weekDayNamesShort
                        ]()}
                        type={
                          selectedDays.indexOf(index) > -1
                            ? "selected"
                            : "plain"
                        }
                        fontSize={AppFontSize.xs}
                        style={{
                          height: 40,
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
                        type={
                          selectedDays.indexOf(index + 1) > -1
                            ? "selected"
                            : "plain"
                        }
                        fontSize={AppFontSize.xs}
                        style={{
                          height: 40,
                          borderRadius: 100,
                          marginRight: 10
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
                flexDirection: "column",
                justifyContent: "center",
                marginBottom: DefaultAppStyles.GAP_VERTICAL,
                alignItems: "center"
              }}
            >
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                isDarkModeEnabled={isDark}
                is24Hour={db.settings.getTimeFormat() === "24-hour"}
                date={date || new Date(Date.now())}
              />

              <DatePicker
                date={date}
                maximumDate={dayjs(date).add(3, "months").toDate()}
                onDateChange={handleConfirm}
                textColor={isDark ? colors.static.white : colors.static.black}
                fadeToColor={colors.primary.background}
                theme={isDark ? "dark" : "light"}
                androidVariant="nativeAndroid"
                is24hourSource="locale"
                locale={
                  db.settings?.getTimeFormat() === "24-hour" ? "en_GB" : "en_US"
                }
                mode={
                  reminderMode === ReminderModes.Repeat &&
                  recurringMode !== "year"
                    ? "time"
                    : "datetime"
                }
              />

              {reminderMode === ReminderModes.Repeat ? null : (
                <Button
                  style={{
                    width: "100%"
                  }}
                  title={
                    date
                      ? getFormattedDate(date, "date-time")
                      : strings.selectDate()
                  }
                  type={date ? "secondaryAccented" : "secondary"}
                  icon="calendar"
                  fontSize={AppFontSize.sm}
                  onPress={() => {
                    showDatePicker();
                  }}
                />
              )}
            </View>
          )}

          {reminderMode === ReminderModes.Once ||
          reminderMode === ReminderModes.Permanent ? null : (
            <View
              style={{
                borderRadius: defaultBorderRadius,
                flexDirection: "row",
                paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
                alignItems: "center",
                justifyContent: "flex-start",
                marginBottom: DefaultAppStyles.GAP_VERTICAL
              }}
            >
              <>
                <Paragraph
                  size={AppFontSize.xxs}
                  color={colors.secondary.paragraph}
                >
                  {recurringMode === RecurringModes.Daily
                    ? strings.reminderRepeatStrings.day(
                        dayjs(date).format("hh:mm A")
                      )
                    : recurringMode === RecurringModes.Year
                    ? strings.reminderRepeatStrings.year(
                        dayjs(date).format("dddd, MMMM D, h:mm A")
                      )
                    : selectedDays.length === 7 &&
                      recurringMode === RecurringModes.Week
                    ? strings.reminderRepeatStrings.week.daily(
                        dayjs(date).format("hh:mm A")
                      )
                    : selectedDays.length === 0
                    ? strings.reminderRepeatStrings[
                        recurringMode as "week" | "month"
                      ].selectDays()
                    : strings.reminderRepeatStrings.repeats(
                        repeatFrequency,
                        recurringMode as string,
                        getSelectedDaysText(selectedDays),
                        dayjs(date).format("hh:mm A")
                      )}
                </Paragraph>
              </>
            </View>
          )}

          <ReminderTime
            reminder={reminder}
            style={{
              width: "100%",
              justifyContent: "flex-start",
              borderWidth: 0,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
              alignSelf: "flex-start"
            }}
          />

          {reminderMode === ReminderModes.Permanent ? null : (
            <ScrollView
              style={{
                flexDirection: "row",
                marginTop: DefaultAppStyles.GAP_VERTICAL,
                height: 50
              }}
              horizontal
            >
              {Object.keys(ReminderNotificationModes).map((mode) => (
                <Button
                  key={mode}
                  title={strings.reminderNotificationModes(
                    mode as keyof typeof ReminderNotificationModes
                  )}
                  style={{
                    marginRight: 12,
                    paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
                  }}
                  icon={
                    mode === "Silent"
                      ? "minus-circle"
                      : mode === "Vibrate"
                      ? "vibrate"
                      : "volume-high"
                  }
                  fontSize={AppFontSize.xs}
                  height={35}
                  type={
                    reminderNotificationMode ===
                    ReminderNotificationModes[
                      mode as keyof typeof ReminderNotificationModes
                    ]
                      ? "selectedAccent"
                      : "plain"
                  }
                  onPress={() => {
                    const _mode = ReminderNotificationModes[
                      mode as keyof typeof ReminderNotificationModes
                    ] as Reminder["priority"];
                    SettingsService.set({
                      reminderNotificationMode: _mode
                    });
                    setReminderNotificatioMode(_mode);
                  }}
                />
              ))}
            </ScrollView>
          )}
        </ScrollView>
      </KeyboardViewIOS>
    </SafeAreaView>
  );
}

AddReminder.present = (reminder?: Reminder, reference?: Note) => {
  Navigation.navigate("AddReminder", {
    reminder,
    reference
  });
};
