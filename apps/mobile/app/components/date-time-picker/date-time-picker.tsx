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
import { useThemeColors } from "@notesnook/theme";
import dayjs, { locale } from "dayjs";
import React, { useMemo } from "react";
import { I18nManager, ViewStyle } from "react-native";
import RNDateTimePicker, {
  DateType,
  useDefaultStyles
} from "react-native-ui-datepicker";
import { FontFamily } from "../../common/design/font";
import { Radius } from "../../common/design/spacing";
import { db } from "../../common/database";
import { useSettingStore } from "../../stores/use-setting-store";
import AppIcon from "../ui/AppIcon";
import DeviceInfo from "react-native-device-info";

export type DateTimePickerMode = "date" | "time" | "datetime";

export type DateTimePickerProps = {
  /**
   * Which parts of the value can be picked. `date` shows only the calendar,
   * `time` shows only the time wheel and `datetime` shows both.
   */
  mode?: DateTimePickerMode;
  date: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  /**
   * Force 24-hour time. Defaults to the user's time format setting.
   */
  is24Hour?: boolean;
  /**
   * First day of the week (0 = Sunday, 1 = Monday). Defaults to the user's
   * week format setting.
   */
  firstDayOfWeek?: number;
  style?: ViewStyle;
};

const toDate = (value: DateType) =>
  value ? dayjs(value).toDate() : new Date();

/**
 * Themed date/time picker built on top of `react-native-ui-datepicker`.
 * Renders inline; use `DateTimePicker.present()` (see index) for the sheet.
 */
export default function DateTimePicker({
  mode = "date",
  date,
  onChange,
  minDate,
  maxDate,
  is24Hour,
  firstDayOfWeek,
  style
}: DateTimePickerProps) {
  const { colors, isDark } = useThemeColors();
  const defaultStyles = useDefaultStyles(isDark ? "dark" : "light");
  const weekFormat = useSettingStore((state) => state.weekFormat);

  const use12Hours =
    (is24Hour ?? db.settings.getTimeFormat() === "24-hour") === false;
  const firstDay = firstDayOfWeek ?? (weekFormat === "Mon" ? 1 : 0);

  const styles = useMemo(
    () =>
      ({
        ...defaultStyles,
        today: {
          borderColor: colors.primary.accent,
          borderWidth: 1,
          borderRadius: Radius.S
        },
        today_label: {
          color: colors.primary.accent
        },
        selected: {
          backgroundColor: colors.primary.accent,
          borderRadius: Radius.S
        },
        selected_label: {
          color: colors.static.white
        },
        day_label: {
          color: colors.primary.paragraph,
          fontFamily: FontFamily.REGULAR
        },
        disabled_label: {
          color: colors.disabled.paragraph
        },
        outside_label: {
          color: colors.secondary.paragraph
        },
        weekday_label: {
          color: colors.secondary.paragraph,
          fontFamily: FontFamily.MEDIUM
        },
        month_selector_label: {
          color: colors.primary.heading,
          fontFamily: FontFamily.SEMI_BOLD
        },
        year_selector_label: {
          color: colors.primary.heading,
          fontFamily: FontFamily.SEMI_BOLD
        },
        time_selector_label: {
          color: colors.primary.heading,
          fontFamily: FontFamily.SEMI_BOLD
        },
        month_label: {
          color: colors.primary.paragraph
        },
        year_label: {
          color: colors.primary.paragraph
        },
        selected_month: {
          backgroundColor: colors.primary.accent,
          borderRadius: Radius.S
        },
        selected_month_label: {
          color: colors.static.white
        },
        selected_year: {
          backgroundColor: colors.primary.accent,
          borderRadius: Radius.S
        },
        selected_year_label: {
          color: colors.static.white
        },
        active_year: {
          backgroundColor: colors.secondary.background,
          borderRadius: Radius.S
        },
        time_label: {
          color: colors.primary.heading,
          fontFamily: FontFamily.SEMI_BOLD
        },
        time_selected_indicator: {
          backgroundColor: colors.secondary.background,
          borderRadius: Radius.S
        }
      }) as ReturnType<typeof useDefaultStyles>,
    [colors, defaultStyles]
  );

  return (
    <RNDateTimePicker
      mode="single"
      date={date}
      timePicker={mode !== "date"}
      initialView={mode === "time" ? "time" : "day"}
      hideHeader={mode === "time"}
      use12Hours={use12Hours}
      firstDayOfWeek={firstDay}
      minDate={minDate}
      maxDate={maxDate}
      styles={styles}
      components={{
        IconPrev: (
          <AppIcon
            name="chevron-left"
            iconFamily="notesnook"
            size={20}
            color={colors.primary.icon}
          />
        ),
        IconNext: (
          <AppIcon
            name="chevron-right"
            iconFamily="notesnook"
            size={20}
            color={colors.primary.icon}
          />
        )
      }}
      onChange={(params) => {
        const changed = (params as { date: DateType }).date;
        onChange(toDate(changed));
      }}
    />
  );
}
