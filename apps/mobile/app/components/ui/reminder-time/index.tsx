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
import { isReminderActive } from "@notesnook/core";
import React from "react";
import { ViewStyle } from "react-native";

import { useThemeColors } from "@notesnook/theme";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import { Button, ButtonProps } from "../button";
import { getFormattedReminderTime } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Reminder } from "@notesnook/core";
import { DefaultAppStyles } from "../../../utils/styles";

function localizeReminderTime(time?: string): string | undefined {
  if (!time) return undefined;
  if (time === "Ongoing") return strings.ongoing();
  if (time.startsWith("Snoozed until ")) {
    return strings.snoozedUntil(time.replace("Snoozed until ", ""));
  }
  let result = time;
  if (result.startsWith("Upcoming: ")) {
    result = `${strings.upcoming()}: ${result.slice(10)}`;
  } else if (result.startsWith("Last: ")) {
    result = `${strings.last()}: ${result.slice(6)}`;
  }
  return result
    .replace("Today", strings.today())
    .replace("Tomorrow", strings.tomorrow())
    .replace("Yesterday", strings.yesterday());
}

export const ReminderTime = ({
  checkIsActive = true,
  style,
  ...props
}: {
  short?: boolean;
  onPress?: () => void;
  reminder?: Reminder;
  color?: string;
  style?: ViewStyle;
  checkIsActive?: boolean;
} & ButtonProps) => {
  const { colors } = useThemeColors();
  const reminder = props.reminder;
  const rawTime = !reminder
    ? undefined
    : getFormattedReminderTime(reminder, props.short || false);
  const time = localizeReminderTime(rawTime);
  const isTodayOrTomorrow =
    (rawTime?.includes("Today") || rawTime?.includes("Tomorrow")) &&
    !rawTime?.includes("Last");
  const isActive =
    checkIsActive && reminder ? isReminderActive(reminder) : true;

  return reminder && isActive ? (
    <Button
      title={time}
      key={reminder.id}
      icon="bell"
      fontSize={AppFontSize.xs}
      iconSize={AppFontSize.sm}
      type="secondary"
      buttonType={
        isTodayOrTomorrow
          ? {
              text: props.color || colors.primary.accent
            }
          : undefined
      }
      textStyle={{
        marginRight: 0
      }}
      style={{
        height: "auto",
        borderRadius: defaultBorderRadius,
        borderColor: colors.primary.border,
        paddingHorizontal: DefaultAppStyles.GAP_SMALL,
        ...(style as ViewStyle)
      }}
      {...props}
      onPress={props.onPress}
    />
  ) : null;
};
