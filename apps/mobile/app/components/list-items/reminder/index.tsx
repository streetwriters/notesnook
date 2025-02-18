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
import { Reminder } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import { Properties } from "../../properties";
import ReminderSheet from "../../sheets/reminder";
import { IconButton } from "../../ui/icon-button";
import { ReminderTime } from "../../ui/reminder-time";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import SelectionWrapper, { selectItem } from "../selection-wrapper";
import { strings } from "@notesnook/intl";
import { useSelectionStore } from "../../../stores/use-selection-store";
import useIsSelected from "../../../hooks/use-selected";
import AppIcon from "../../ui/AppIcon";

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
    const openReminder = () => {
      if (selectItem(item)) return;

      ReminderSheet.present(item, undefined, isSheet);
    };
    const selectionMode = useSelectionStore((state) => state.selectionMode);
    const [selected] = useIsSelected(item);
    return (
      <SelectionWrapper onPress={openReminder} item={item} isSheet={isSheet}>
        <View
          style={{
            opacity: item.disabled ? 0.5 : 1,
            maxWidth: "80%",
            flexGrow: 1
          }}
        >
          <Heading
            numberOfLines={1}
            style={{
              flexWrap: "wrap"
            }}
            size={AppFontSize.md}
          >
            {item.title}
          </Heading>

          {item.description ? (
            <Paragraph
              style={{
                flexWrap: "wrap"
              }}
              numberOfLines={2}
            >
              {item.description}
            </Paragraph>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 5
            }}
          >
            {item.disabled ? (
              <View
                style={{
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius,
                  flexDirection: "row",
                  paddingHorizontal: 6,
                  alignItems: "center",
                  marginTop: 5,
                  justifyContent: "flex-start",
                  alignSelf: "flex-start",
                  marginRight: 10,
                  height: 30
                }}
              >
                <Icon
                  name="bell-off-outline"
                  size={AppFontSize.md}
                  color={colors.error.icon}
                />
                <Paragraph
                  size={AppFontSize.xs}
                  color={colors.secondary.paragraph}
                  style={{ marginLeft: 5 }}
                >
                  {strings.disabled()}
                </Paragraph>
              </View>
            ) : null}
            {item.mode === "repeat" && item.recurringMode ? (
              <View
                style={{
                  backgroundColor: colors.secondary.background,
                  borderRadius: defaultBorderRadius,
                  flexDirection: "row",
                  paddingHorizontal: 6,
                  alignItems: "center",
                  marginTop: 5,
                  justifyContent: "flex-start",
                  alignSelf: "flex-start",
                  marginRight: 10,
                  height: 30
                }}
              >
                <Icon
                  name="reload"
                  size={AppFontSize.md}
                  color={colors.primary.accent}
                />
                <Paragraph
                  size={AppFontSize.xs}
                  color={colors.secondary.paragraph}
                  style={{ marginLeft: 5 }}
                >
                  {strings.reminderRecurringMode[item.recurringMode]()}
                </Paragraph>
              </View>
            ) : null}

            <ReminderTime
              reminder={item}
              checkIsActive={false}
              fontSize={AppFontSize.xs}
              style={{
                justifyContent: "flex-start",
                height: 25,
                alignSelf: "flex-start"
              }}
            />
          </View>
        </View>

        {selectionMode === "note" || selectionMode === "trash" ? (
          <>
            <AppIcon
              name={selected ? "checkbox-outline" : "checkbox-blank-outline"}
              color={selected ? colors.selected.icon : colors.primary.icon}
              size={AppFontSize.lg}
            />
          </>
        ) : (
          <IconButton
            testID={notesnook.listitem.menu}
            color={colors.primary.paragraph}
            name="dots-horizontal"
            size={AppFontSize.xl}
            onPress={() => Properties.present(item, isSheet)}
            style={{
              justifyContent: "center",
              height: 35,
              width: 35,
              borderRadius: 100,
              alignItems: "center"
            }}
          />
        )}
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
