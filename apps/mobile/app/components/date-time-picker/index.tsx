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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { View, ViewStyle } from "react-native";
import { Radius, Spacing } from "../../common/design/spacing";
import { presentDialog } from "../dialog/functions";
import { presentSheet } from "../../services/event-manager";
import AppIcon from "../ui/AppIcon";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import DateTimePicker, {
  DateTimePickerMode,
  DateTimePickerProps
} from "./date-time-picker";

export { default } from "./date-time-picker";
export type {
  DateTimePickerMode,
  DateTimePickerProps
} from "./date-time-picker";

const DEFAULT_ICONS: Record<DateTimePickerMode, string> = {
  date: "calendar-dots",
  time: "clock",
  datetime: "calendar-dots"
};

export type PresentDateTimePickerOptions = Pick<
  DateTimePickerProps,
  "minDate" | "maxDate" | "is24Hour" | "firstDayOfWeek"
> & {
  mode?: DateTimePickerMode;
  /** Initial value the picker opens on. Defaults to now. */
  date?: Date;
  title?: string;
  description?: string;
  icon?: string;
  /** Label for the confirm button. Defaults to `strings.done()`. */
  confirmText?: string;
  /** Dialog context to render into (dialog presentation only). */
  context?: string;
  onConfirm: (date: Date) => void;
  onCancel?: () => void;
};

type Presentation = "dialog" | "sheet";

type DateTimePickerContentProps = PresentDateTimePickerOptions & {
  presentation: Presentation;
  close?: (ctx?: string) => void;
};

/**
 * The shared picker body used by both the dialog and the sheet: a header,
 * the themed picker, and Cancel/Confirm actions. Presentation-specific chrome
 * (the dialog card vs. the sheet surface) is applied by the outer container.
 */
function DateTimePickerContent({
  presentation,
  mode = "date",
  date,
  minDate,
  maxDate,
  is24Hour,
  firstDayOfWeek,
  title,
  description,
  icon,
  confirmText,
  onConfirm,
  onCancel,
  close
}: DateTimePickerContentProps) {
  const { colors } = useThemeColors();
  const [selected, setSelected] = useState<Date>(date || new Date());

  const containerStyle: ViewStyle =
    presentation === "dialog"
      ? {
          width: "90%",
          maxWidth: 400,
          alignSelf: "center",
          backgroundColor: colors.primary.background,
          borderRadius: Radius.S,
          borderWidth: 0.5,
          borderColor: colors.primary.border,
          overflow: "hidden"
        }
      : {
          width: "100%"
        };

  return (
    <View style={containerStyle}>
      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          paddingVertical: Spacing.LEVEL_4,
          gap: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: Spacing.LEVEL_1
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: Radius.XS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary.background
            }}
          >
            <AppIcon
              name={icon || DEFAULT_ICONS[mode]}
              iconFamily="notesnook"
              size={16}
              color={colors.primary.icon}
            />
          </View>
          <View style={{ flexShrink: 1, gap: Spacing.LEVEL_1 }}>
            <Heading fontSize="XL" lineHeight="100%">
              {title ||
                (mode === "time"
                  ? strings.selectTimeHeading()
                  : strings.selectDate())}
            </Heading>
            {description ? (
              <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
                {description}
              </Paragraph>
            ) : null}
          </View>
        </View>

        {/* <View style={{ height: 1, backgroundColor: colors.primary.border }} /> */}

        <DateTimePicker
          mode={mode}
          date={selected}
          onChange={setSelected}
          minDate={minDate}
          maxDate={maxDate}
          is24Hour={is24Hour}
          firstDayOfWeek={firstDayOfWeek}
        />

        <View style={{ flexDirection: "row", gap: Spacing.LEVEL_2 }}>
          <Button
            title={strings.cancel()}
            type="plain-outline"
            style={{ flex: 1, width: "auto" }}
            onPress={() => {
              close?.();
              onCancel?.();
            }}
          />
          <Button
            title={confirmText || strings.done()}
            type="accent"
            style={{ flex: 1, width: "auto" }}
            onPress={() => {
              close?.();
              onConfirm(selected);
            }}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Show the themed date/time picker in a dialog. This is the default surface
 * used across the app. Resolves the picked value through `onConfirm`;
 * dismissing without confirming calls `onCancel`.
 */
export function presentDateTimePicker(options: PresentDateTimePickerOptions) {
  presentDialog({
    context: options.context || "global",
    component: (close) => (
      <DateTimePickerContent {...options} presentation="dialog" close={close} />
    )
  });
}

/**
 * Show the same date/time picker in a bottom sheet. Preferred on the
 * add-reminder screen; elsewhere use {@link presentDateTimePicker}.
 */
export function presentDateTimePickerSheet(
  options: PresentDateTimePickerOptions
) {
  presentSheet({
    context: options.context || "global",
    component: (_ref, close) => (
      <DateTimePickerContent {...options} presentation="sheet" close={close} />
    )
  });
}
