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
import { getFormattedReminderTime } from "@notesnook/common";
import { Reminder } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { View } from "react-native";
import { notesnook } from "../../../../e2e/test.ids";
import { Radius, Spacing } from "../../../common/design/spacing";
import useIsSelected from "../../../hooks/use-selected";
import AddReminder from "../../../screens/add-reminder";
import { eSendEvent } from "../../../services/event-manager";
import {
  selectItem,
  useSelectionStore
} from "../../../stores/use-selection-store";
import { eCloseSheet } from "../../../utils/events";
import { Properties } from "../../properties";
import AppIcon from "../../ui/AppIcon";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import SelectionWrapper from "../selection-wrapper";

const ReminderItem = React.memo(
  ({
    item,
    index,
    isSheet
  }: {
    item: Reminder;
    index: number;
    isSheet: boolean;
  }) => {
    const { colors } = useThemeColors();
    const [checked, setChecked] = useState(false);
    const openReminder = () => {
      if (selectItem(item)) return;
      AddReminder.present(item, undefined);
      if (isSheet) {
        eSendEvent(eCloseSheet);
      }
    };
    const selectionMode = useSelectionStore((state) => state.selectionMode);
    const [selected] = useIsSelected(item);

    // Subtitle segments (reminder time · recurring mode · disabled), rendered as
    // plain text separated by a dot to match the redesign.
    const subtitleSegments = [
      getFormattedReminderTime(item, false),
      item.mode === "repeat" && item.recurringMode
        ? strings.reminderRecurringMode[item.recurringMode]()
        : undefined,
      item.disabled ? strings.disabled() : undefined
    ].filter(Boolean) as string[];

    return (
      <SelectionWrapper
        onPress={() => {
          if (selectItem(item)) return;

          setChecked(!checked);
        }}
        item={item}
        isSheet={isSheet}
        hideSeparator
        style={{
          borderWidth: 1,
          borderColor: colors.primary.border,
          borderRadius: Radius.S,
          marginBottom: Spacing.LEVEL_2,
          backgroundColor: selected ? colors.primary.shade : undefined
        }}
        wrapperStyle={{
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        {/* Leading "done" checkbox — visual only for now, not yet wired. */}
        <AppIcon
          name={checked ? "checkbox" : "box-empty"}
          iconFamily="notesnook"
          color={
            checked
              ? [colors.primary.accent, colors.primary.accentForeground]
              : colors.primary.icon
          }
          size={16}
          style={{
            marginRight: Spacing.LEVEL_1
          }}
        />

        <View
          style={{
            flexGrow: 1,
            flexShrink: 1,
            gap: Spacing.LEVEL_1,
            opacity: item.disabled ? 0.5 : 1
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between"
            }}
          >
            <Heading
              fontSize="MD"
              style={{
                flexShrink: 1
              }}
              color={colors.primary.heading}
            >
              {item.title}
            </Heading>

            <IconButton
              testID={notesnook.listitem.menu}
              color={colors.secondary.icon}
              name="dots-three"
              iconFamily="notesnook"
              size={20}
              onPress={() => Properties.present(item, isSheet)}
              style={{
                justifyContent: "center",
                height: undefined,
                width: undefined,
                borderRadius: 100,
                alignItems: "center"
              }}
            />
          </View>

          {item.description ? (
            <Paragraph fontSize="SM">{item.description}</Paragraph>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              gap: Spacing.LEVEL_1
            }}
          >
            {subtitleSegments.map((segment, i) => (
              <React.Fragment key={segment}>
                {i > 0 ? (
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 100,
                      backgroundColor: colors.secondary.icon
                    }}
                  />
                ) : null}
                <Paragraph
                  fontSize="SM"
                  lineHeight="100%"
                  color={colors.secondary.paragraph}
                >
                  {segment}
                </Paragraph>
              </React.Fragment>
            ))}
          </View>
        </View>
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.item?.dateModified !== next.item?.dateModified) {
      return false;
    }
    return true;
  }
);
ReminderItem.displayName = "ReminderItem";

export default ReminderItem;
