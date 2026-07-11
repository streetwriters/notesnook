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
import {
  getFormattedDate,
  useIsFeatureAvailable,
  usePromise
} from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Radius } from "../../common/design/spacing";
import { db } from "../../common/database";
import { Dialog } from "../../components/dialog";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import FormInput, {
  createFormRef,
  validators
} from "../../components/ui/input/form-input";
import { Pressable } from "../../components/ui/pressable";
import LineSeparator from "../../components/ui/seperator/line-separator";
import { TimeSince } from "../../components/ui/time-since";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import { eSendEvent, ToastManager } from "../../services/event-manager";
import Navigation, { NavigationProps } from "../../services/navigation";
import Notifications from "../../services/notifications";
import SettingsService from "../../services/settings";
import PaywallSheet from "../../components/sheets/paywall";
import { useRelationStore } from "../../stores/use-relation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { eOnLoadNote } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { AppFontSize } from "../../utils/size";

// Frequency chips shown in the "Reminder frequency" section. "once" maps to
// reminderMode = "once", the rest map to reminderMode = "repeat" + recurringMode.
const FrequencyModes = ["once", "day", "week", "month", "year"] as const;
type FrequencyMode = (typeof FrequencyModes)[number];

const WeekDays = [0, 1, 2, 3, 4, 5, 6];
const WeekDaysMon = [1, 2, 3, 4, 5, 6, 0];
const MonthDays = new Array(31).fill(true);

const ReminderNotificationModes = {
  Silent: "silent",
  Vibrate: "vibrate",
  Urgent: "urgent"
} as const;

export default function AddReminder(props: NavigationProps<"AddReminder">) {
  const { reminder, reference } = props.route.params;
  useNavigationFocus(props.navigation, {
    focusOnInit: true,
    onFocus: () => {
      if (!props.route.params?.reminder) {
        setTimeout(() => {
          titleRef.current?.focus();
        }, 200);
      }
      return false;
    }
  });
  const { colors, isDark } = useThemeColors();
  const weekFormat = useSettingStore((state) => state.weekFormat);
  const [reminderMode, setReminderMode] = useState<Reminder["mode"]>(
    reminder?.mode === "permanent" ? "once" : reminder?.mode || "once"
  );
  const [allDay, setAllDay] = useState(reminder?.mode === "permanent");
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
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [dateSelected, setDateSelected] = useState(!!reminder);
  const [timeSelected, setTimeSelected] = useState(!!reminder);
  const [frequencyExpanded, setFrequencyExpanded] = useState(true);
  const [moreOptionsExpanded, setMoreOptionsExpanded] = useState(false);
  const referencedItem = reference ? (reference as Note) : null;
  const recurringReminderFeature = useIsFeatureAvailable("recurringReminders");
  const formRef = useRef(
    createFormRef({
      title: reminder?.title || referencedItem?.title || "",
      description: reminder?.description || referencedItem?.headline || ""
    })
  );
  const title = useRef<string | undefined>(
    !reminder ? referencedItem?.title : reminder?.title
  );
  const details = useRef<string | undefined>(
    !reminder ? referencedItem?.headline : reminder?.description
  );
  const titleRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const referencedNotes = usePromise(
    () =>
      reminder?.id
        ? db.relations
            .to({ id: reminder.id, type: "reminder" }, "note")
            .resolve()
        : null,
    [reminder?.id]
  );
  const [dateError, setDateError] = useState<string>();
  const [selectDayError, setSelectDayError] = useState<string>();

  // The frequency chip currently reflected by reminderMode + recurringMode.
  const currentFrequency: FrequencyMode =
    reminderMode === "once" ? "once" : recurringMode || "week";
  // Once and yearly reminders pick a specific date; daily/weekly/monthly only a time.
  const showDatePicker = reminderMode === "once" || recurringMode === "year";
  const showDaySelector =
    reminderMode === "repeat" &&
    (recurringMode === "week" || recurringMode === "month");

  const openPicker = (mode: "date" | "time") => {
    setPickerMode(mode);
    setDatePickerVisibility(true);
  };

  const hidePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selected: Date) => {
    hidePicker();
    setDateError(undefined);
    const next = new Date(date);
    if (pickerMode === "time") {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setTimeSelected(true);
    } else {
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );
      setDateSelected(true);
    }
    setDate(next);
  };

  const selectFrequency = (mode: FrequencyMode) => {
    if (
      mode !== "once" &&
      recurringReminderFeature &&
      !recurringReminderFeature?.isAllowed
    ) {
      PaywallSheet.present(recurringReminderFeature);
      return;
    }
    setSelectDayError(undefined);
    if (mode === "once") {
      setReminderMode("once");
      return;
    }
    setReminderMode("repeat");
    setRecurringMode(mode as Reminder["recurringMode"]);
    if (mode === "week") {
      setSelectedDays((days) => (days.length ? days : [date.getDay()]));
    } else if (mode === "month") {
      setSelectedDays((days) => (days.length ? days : [date.getDate()]));
    } else {
      setSelectedDays([]);
    }
  };

  const toggleDay = (day: number) => {
    setSelectDayError(undefined);
    setSelectedDays((days) => {
      if (days.indexOf(day) > -1) {
        return days.filter((d) => d !== day);
      }
      return [...days, day];
    });
  };

  async function saveReminder() {
    try {
      if (!formRef.current.validate()) return;

      const mode: Reminder["mode"] = allDay ? "permanent" : reminderMode;

      if (date.getTime() < Date.now() && mode === "once") {
        setDateError(strings.dateError());
        return;
      }

      if (
        mode === "repeat" &&
        recurringMode !== "day" &&
        recurringMode !== "year" &&
        selectedDays.length === 0
      ) {
        setSelectDayError(strings.selectDayError());
        return;
      }

      if (!date && mode !== "permanent") return;

      if (!(await Notifications.checkAndRequestPermissions(true)))
        throw new Error(strings.noNotificationPermission());

      date.setSeconds(0, 0);

      const reminderId = await db.reminders?.add({
        id: reminder?.id,
        date: date?.getTime(),
        priority: reminderNotificationMode,
        title: title.current,
        description: details.current,
        recurringMode: recurringMode,
        selectedDays: selectedDays,
        mode: mode,
        localOnly: mode === "permanent",
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
          style={{
            backgroundColor: "transparent"
          }}
        />
        <LineSeparator paddingHorizontal={Spacing.LEVEL_3} />

        <Dialog context="local" />
        <ScrollView
          style={{
            flex: 1
          }}
          contentContainerStyle={{
            paddingHorizontal: Spacing.LEVEL_3,
            paddingVertical: Spacing.LEVEL_4,
            gap: Spacing.LEVEL_4
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {/* Title + short detail */}
          <View style={{ gap: Spacing.LEVEL_2 }}>
            <FormInput
              name="title"
              validators={[validators.required(strings.titleIsRequired())]}
              formRef={formRef}
              fwdRef={titleRef}
              label={strings.title()}
              defaultValue={reminder?.title || referencedItem?.title}
              placeholder={strings.reminderTitlePlaceholder()}
              onChangeText={(text) => (title.current = text)}
              onSubmitEditing={() => {
                descriptionRef.current?.focus();
              }}
            />

            <FormInput
              name="description"
              validators={[]}
              formRef={formRef}
              label={strings.reminderShortDetail()}
              defaultValue={
                reminder ? reminder?.description : referencedItem?.headline
              }
              fwdRef={descriptionRef}
              placeholder={strings.reminderDetailsPlaceholder()}
              containerStyle={{
                maxHeight: 100
              }}
              multiline
              textAlignVertical="top"
              inputStyle={{
                minHeight: 80,
                paddingVertical: Spacing.LEVEL_2
              }}
              height={80}
            />
          </View>

          {/* Reminder frequency */}
          <View style={{ gap: Spacing.LEVEL_3 }}>
            <Heading fontSize="LG" lineHeight="100%">
              {strings.reminderFrequency()}
            </Heading>

            <Pressable
              type={frequencyExpanded ? "selected" : "plain-outline"}
              onPress={() => setFrequencyExpanded((v) => !v)}
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: Spacing.LEVEL_1,
                padding: Spacing.LEVEL_2,
                borderRadius: Radius.S
              }}
            >
              <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
                <Heading fontFamily="MEDIUM" fontSize="MD" lineHeight="100%">
                  {`${strings.reminderModes("repeat")}: ${
                    currentFrequency === "once"
                      ? strings.reminderModes("once")
                      : strings.recurringModes(currentFrequency)
                  }`}
                </Heading>
                <Paragraph
                  fontSize="SM"
                  color={colors.secondary.paragraph}
                  lineHeight="120%"
                >
                  {strings.reminderFrequencyDescription(currentFrequency)}
                </Paragraph>
              </View>
              <AppIcon
                name={frequencyExpanded ? "chevron-up" : "chevron-down"}
                iconFamily="notesnook"
                size={12}
                color={colors.primary.icon}
              />
            </Pressable>

            {frequencyExpanded ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: Spacing.LEVEL_2
                  }}
                >
                  {FrequencyModes.map((mode) => {
                    const selected = currentFrequency === mode;
                    return (
                      <Pressable
                        key={mode}
                        type={selected ? "selected" : "transparent"}
                        onPress={() => selectFrequency(mode)}
                        style={{
                          width: "auto",
                          alignSelf: "flex-start",
                          paddingHorizontal: Spacing.LEVEL_3,
                          paddingVertical: Spacing.LEVEL_1,
                          borderRadius: Radius.XS,
                          borderWidth: selected ? 0 : 1,
                          borderColor: colors.primary.border
                        }}
                      >
                        <Heading
                          fontFamily="MEDIUM"
                          fontSize="SM"
                          lineHeight="100%"
                          color={
                            selected
                              ? colors.primary.heading
                              : colors.secondary.paragraph
                          }
                        >
                          {mode === "once"
                            ? strings.reminderModes("once")
                            : strings.recurringModes(mode)}
                        </Heading>
                      </Pressable>
                    );
                  })}
                </View>

                {showDaySelector ? (
                  <View style={{ gap: Spacing.LEVEL_2 }}>
                    <Paragraph
                      fontSize="SM"
                      color={colors.primary.paragraph}
                      lineHeight="100%"
                    >
                      {recurringMode === "month"
                        ? strings.selectDate()
                        : strings.reminderSelectDays()}
                    </Paragraph>
                    <View>
                      <ScrollView
                        horizontal
                        contentContainerStyle={{
                          gap: Spacing.LEVEL_1
                        }}
                      >
                        {recurringMode === "week"
                          ? (weekFormat === "Mon" ? WeekDaysMon : WeekDays).map(
                              (day) => {
                                const selected = selectedDays.indexOf(day) > -1;
                                return (
                                  <Pressable
                                    key={day + "weekday"}
                                    type={selected ? "selected" : "transparent"}
                                    onPress={() => toggleDay(day)}
                                    style={{
                                      width: 35,
                                      height: 32,
                                      justifyContent: "center",
                                      alignItems: "center",
                                      borderRadius: Radius.XS,
                                      borderWidth: selected ? 0 : 1,
                                      borderColor: colors.primary.border
                                    }}
                                  >
                                    <Heading
                                      fontFamily={
                                        selected ? "SEMI_BOLD" : "MEDIUM"
                                      }
                                      fontSize="SM"
                                      lineHeight="100%"
                                      color={
                                        selected
                                          ? colors.primary.accent
                                          : colors.secondary.paragraph
                                      }
                                    >
                                      {strings.weekDayNamesShort[
                                        day as keyof typeof strings.weekDayNamesShort
                                      ]().charAt(0)}
                                    </Heading>
                                  </Pressable>
                                );
                              }
                            )
                          : MonthDays.map((_, index) => {
                              const day = index + 1;
                              const selected = selectedDays.indexOf(day) > -1;
                              return (
                                <Pressable
                                  key={day + "monthday"}
                                  type={selected ? "selected" : "transparent"}
                                  onPress={() => toggleDay(day)}
                                  style={{
                                    width: 35,
                                    height: 32,
                                    borderRadius: Radius.XS,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    borderWidth: selected ? 0 : 1,
                                    borderColor: colors.primary.border
                                  }}
                                >
                                  <Heading
                                    fontFamily={
                                      selected ? "SEMI_BOLD" : "MEDIUM"
                                    }
                                    fontSize="SM"
                                    lineHeight="100%"
                                    color={
                                      selected
                                        ? colors.primary.accent
                                        : colors.secondary.paragraph
                                    }
                                  >
                                    {day}
                                  </Heading>
                                </Pressable>
                              );
                            })}
                      </ScrollView>
                    </View>
                    {selectDayError ? (
                      <Paragraph fontSize="XS" color={colors.error.icon}>
                        <AppIcon
                          color={colors.error.accent}
                          name="alert-circle-outline"
                          size={AppFontSize.sm - 1}
                        />{" "}
                        {selectDayError}
                      </Paragraph>
                    ) : (
                      <Paragraph
                        fontSize="SM"
                        color={colors.primary.paragraph}
                        lineHeight="100%"
                        style={{ fontStyle: "italic" }}
                      >
                        {recurringMode === "month"
                          ? strings.reminderSelecetDateHelp()
                          : strings.reminderSelectedDayHelp()}
                      </Paragraph>
                    )}
                  </View>
                ) : null}
              </>
            ) : null}
          </View>

          {/* Date & time */}
          <View style={{ gap: Spacing.LEVEL_3 }}>
            <Heading fontSize="LG" lineHeight="100%">
              {showDatePicker
                ? strings.selectDateAndTime()
                : strings.selectTimeHeading()}
            </Heading>
            <View style={{ flexDirection: "row", gap: Spacing.LEVEL_2 }}>
              {showDatePicker ? (
                <DateTimeField
                  value={
                    dateSelected
                      ? getFormattedDate(date, "date")
                      : strings.selectDatesPlaceholder()
                  }
                  placeholder={!dateSelected}
                  icon="calendar-dots"
                  onPress={() => openPicker("date")}
                />
              ) : null}
              <DateTimeField
                value={
                  timeSelected
                    ? getFormattedDate(date, "time")
                    : strings.selectTimePlaceholder()
                }
                placeholder={!timeSelected}
                icon="clock"
                onPress={() => openPicker("time")}
              />
            </View>
            {dateError ? (
              <Paragraph fontSize="XS" color={colors.error.icon}>
                <AppIcon
                  color={colors.error.accent}
                  name="alert-circle-outline"
                  size={AppFontSize.sm - 1}
                />{" "}
                {dateError}
              </Paragraph>
            ) : null}
          </View>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode={pickerMode}
            minimumDate={reminderMode === "once" ? new Date() : undefined}
            onConfirm={handleConfirm}
            onCancel={hidePicker}
            isDarkModeEnabled={isDark}
            firstDayOfWeek={weekFormat === "Mon" ? 1 : 0}
            is24Hour={db.settings.getTimeFormat() === "24-hour"}
            date={date}
            themeVariant={isDark ? "dark" : "light"}
          />

          {/* More options */}
          <View style={{ gap: Spacing.LEVEL_3 }}>
            <Pressable
              type={moreOptionsExpanded ? "selected" : "transparent"}
              onPress={() => setMoreOptionsExpanded((v) => !v)}
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: Spacing.LEVEL_2,
                borderRadius: Radius.S,
                borderWidth: moreOptionsExpanded ? 0 : 1,
                borderColor: colors.primary.border
              }}
            >
              <Heading fontSize="MD" lineHeight="100%">
                {strings.moreOptions()}
              </Heading>
              <AppIcon
                name={moreOptionsExpanded ? "chevron-up" : "chevron-down"}
                iconFamily="notesnook"
                size={12}
                color={colors.primary.icon}
              />
            </Pressable>

            {moreOptionsExpanded ? (
              <>
                {Platform.OS !== "ios" ? (
                  <Pressable
                    type="secondary"
                    onPress={() => setAllDay((v) => !v)}
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.LEVEL_1,
                      padding: Spacing.LEVEL_2,
                      borderRadius: Radius.S
                    }}
                  >
                    <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
                      <Heading fontSize="MD" lineHeight="100%">
                        {strings.allDayReminder()}
                      </Heading>
                      <Paragraph
                        fontSize="SM"
                        color={colors.secondary.paragraph}
                        lineHeight="120%"
                      >
                        {strings.allDayReminderDescription()}
                      </Paragraph>
                    </View>
                    <AppIcon
                      name={allDay ? "toggle-on" : "toggle-off"}
                      iconFamily="notesnook"
                      size={40}
                      color={
                        allDay
                          ? [colors.primary.accent, colors.primary.background]
                          : [colors.disabled.icon, colors.primary.background]
                      }
                    />
                  </Pressable>
                ) : null}

                <View style={{ gap: Spacing.LEVEL_3 }}>
                  <Heading fontSize="MD" lineHeight="100%">
                    {strings.alertMode()}
                  </Heading>
                  <View style={{ flexDirection: "row", gap: Spacing.LEVEL_2 }}>
                    {Object.keys(ReminderNotificationModes).map((key) => {
                      const value =
                        ReminderNotificationModes[
                          key as keyof typeof ReminderNotificationModes
                        ];
                      const selected = reminderNotificationMode === value;
                      return (
                        <Button
                          key={key}
                          title={strings.reminderNotificationModes(
                            key as keyof typeof ReminderNotificationModes
                          )}
                          icon={
                            key === "Silent"
                              ? "minus-circle"
                              : key === "Vibrate"
                                ? "vibrate"
                                : "volume-high"
                          }
                          iconSize={AppFontSize.md}
                          fontSize={AppFontSize.sm}
                          bold={false}
                          type={selected ? "selected" : "plain-outline"}
                          style={{
                            flex: 1,
                            width: "auto",
                            paddingVertical: Spacing.LEVEL_3
                          }}
                          onPress={() => {
                            SettingsService.set({
                              reminderNotificationMode: value
                            });
                            setReminderNotificatioMode(value);
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}
          </View>

          {/* Referenced notes */}
          {referencedNotes &&
          referencedNotes.status === "fulfilled" &&
          referencedNotes.value !== null &&
          referencedNotes.value?.length > 0 ? (
            <View
              style={{
                gap: Spacing.LEVEL_2
              }}
            >
              <Heading fontSize="MD" lineHeight="100%">
                {strings.referencedIn()}
              </Heading>
              {referencedNotes.value.map((item) => (
                <Pressable
                  key={item.id}
                  style={{
                    justifyContent: "space-between",
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: Spacing.LEVEL_3,
                    paddingVertical: Spacing.LEVEL_2,
                    borderRadius: Radius.S
                  }}
                  onPress={() => {
                    Navigation.navigate("FluidPanelsView");
                    fluidTabsRef.current?.goToPage("editor");
                    eSendEvent(eOnLoadNote, {
                      item: item
                    });
                  }}
                  type="secondary"
                >
                  <Paragraph>{item.title}</Paragraph>
                  <TimeSince
                    style={{
                      fontSize: AppFontSize.xxs,
                      color: colors.secondary.paragraph
                    }}
                    time={item.dateEdited}
                    updateFrequency={
                      Date.now() - item.dateEdited < 60000 ? 2000 : 60000
                    }
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom sticky action */}
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3,
            paddingVertical: Spacing.LEVEL_3,
            borderTopWidth: 1,
            borderTopColor: colors.primary.border,
            backgroundColor: colors.primary.background
          }}
        >
          <Button
            title={strings.createReminder()}
            type="accent"
            width="100%"
            fontSize={AppFontSize.md}
            style={{
              paddingVertical: Spacing.LEVEL_3,
              borderRadius: Radius.S
            }}
            onPress={saveReminder}
          />
        </View>
      </KeyboardViewIOS>
    </SafeAreaView>
  );
}

type DateTimeFieldProps = {
  value: string;
  placeholder: boolean;
  icon: string;
  onPress: () => void;
};

function DateTimeField({
  value,
  placeholder,
  icon,
  onPress
}: DateTimeFieldProps) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      type="secondary"
      onPress={onPress}
      style={{
        flex: 1,
        width: "auto",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.LEVEL_1,
        paddingHorizontal: Spacing.LEVEL_2,
        paddingVertical: Spacing.LEVEL_3,
        borderRadius: Radius.S
      }}
    >
      <Paragraph
        fontSize="SM"
        lineHeight="100%"
        color={
          placeholder ? colors.primary.placeholder : colors.primary.paragraph
        }
        numberOfLines={1}
      >
        {value}
      </Paragraph>
      <AppIcon
        name={icon}
        iconFamily="notesnook"
        size={16}
        color={colors.secondary.icon}
      />
    </Pressable>
  );
}

AddReminder.present = (reminder?: Reminder, reference?: Note) => {
  Navigation.navigate("AddReminder", {
    reminder,
    reference
  });
};
