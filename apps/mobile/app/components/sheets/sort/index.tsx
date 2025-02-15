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

import {
  GroupingKey,
  GroupOptions,
  ItemType,
  SortOptions
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { View } from "react-native";
import { db } from "../../../common/database";
import { eSendEvent } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { RouteName } from "../../../stores/use-navigation-store";
import { useNotebookStore } from "../../../stores/use-notebook-store";
import { useTagStore } from "../../../stores/use-tag-store";
import { GROUP, SORT } from "../../../utils/constants";
import { eGroupOptionsUpdated, refreshNotesPage } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
const Sort = ({
  type,
  screen,
  hideGroupOptions
}: {
  type: ItemType;
  screen?: RouteName;
  hideGroupOptions?: boolean;
}) => {
  const { colors } = useThemeColors();
  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions(
      screen === "Notes" ? "home" : ((type + "s") as GroupingKey)
    )
  );
  const updateGroupOptions = async (_groupOptions: GroupOptions) => {
    const groupType =
      screen === "Notes" ? "home" : ((type + "s") as GroupingKey);
    console.log("updateGroupOptions for group", groupType, "in", screen);
    await db.settings.setGroupOptions(groupType, _groupOptions);
    setGroupOptions(_groupOptions);
    setTimeout(() => {
      if (screen) Navigation.queueRoutesForUpdate(screen);
      if (type === "notebook") {
        useNotebookStore.getState().refresh();
      } else if (type === "tag") {
        useTagStore.getState().refresh();
      }
      eSendEvent(eGroupOptionsUpdated, groupType);
      eSendEvent(refreshNotesPage);
    }, 1);
  };

  const setOrderBy = async () => {
    const _groupOptions: GroupOptions = {
      ...groupOptions,
      sortDirection: groupOptions?.sortDirection === "asc" ? "desc" : "asc"
    };

    await updateGroupOptions(_groupOptions);
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        justifyContent: "space-between",
        gap: DefaultAppStyles.GAP_SMALL
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DefaultAppStyles.GAP,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <Heading
          size={AppFontSize.lg}
          style={{
            alignSelf: "center"
          }}
        >
          {strings.sortBy()}
        </Heading>

        <Button
          title={
            groupOptions?.sortDirection === "asc"
              ? groupOptions?.groupBy === "abc" ||
                groupOptions?.sortBy === "title"
                ? strings.aToZ()
                : groupOptions?.sortBy === "dueDate"
                ? strings.earliestFirst()
                : strings.oldNew()
              : groupOptions?.groupBy === "abc" ||
                groupOptions?.sortBy === "title"
              ? strings.zToA()
              : groupOptions?.sortBy === "dueDate"
              ? strings.latestFirst()
              : strings.newOld()
          }
          icon={
            groupOptions?.sortDirection === "asc"
              ? "sort-ascending"
              : "sort-descending"
          }
          height={30}
          iconPosition="right"
          fontSize={AppFontSize.sm}
          type="plain"
          style={{
            paddingHorizontal: DefaultAppStyles.GAP_SMALL
          }}
          onPress={setOrderBy}
        />
      </View>

      <View
        style={{
          flexDirection: "column",
          justifyContent: "flex-start",
          borderBottomColor: colors.primary.border
        }}
      >
        {Object.keys(SORT).map((item) =>
          (item === "dueDate" && screen !== "Reminders") ||
          (screen !== "Tags" &&
            screen !== "Reminders" &&
            item === "dateModified") ||
          ((screen === "Tags" || screen === "Reminders") &&
            item === "dateEdited") ? null : (
            <Pressable
              key={item}
              type={groupOptions?.sortBy === item ? "selected" : "plain"}
              noborder
              style={{
                width: "100%",
                justifyContent: "space-between",
                height: 40,
                flexDirection: "row",
                borderRadius: 0,
                paddingHorizontal: DefaultAppStyles.GAP
              }}
              onPress={async () => {
                const _groupOptions: GroupOptions = {
                  ...groupOptions,
                  sortBy:
                    type === "trash"
                      ? "dateDeleted"
                      : (item as SortOptions["sortBy"])
                };
                await updateGroupOptions(_groupOptions);
              }}
            >
              <Paragraph>
                {strings.sortByStrings[
                  item as keyof typeof strings.sortByStrings
                ]()}
              </Paragraph>

              {groupOptions.sortBy === item ? (
                <AppIcon
                  size={AppFontSize.lg}
                  name="check"
                  color={colors.selected.accent}
                />
              ) : null}
            </Pressable>
          )
        )}
      </View>

      {!hideGroupOptions ? (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: DefaultAppStyles.GAP,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            <Heading size={AppFontSize.lg}>{strings.groupBy()}</Heading>
          </View>

          <View
            style={{
              borderRadius: 0,
              flexDirection: "row",
              flexWrap: "wrap"
            }}
          >
            {Object.keys(GROUP).map((item) => (
              <Pressable
                key={item}
                type={
                  groupOptions?.groupBy === GROUP[item as keyof typeof GROUP]
                    ? "selected"
                    : "plain"
                }
                noborder
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  height: 40,
                  flexDirection: "row",
                  borderRadius: 0,
                  paddingHorizontal: DefaultAppStyles.GAP
                }}
                onPress={async () => {
                  const _groupOptions: GroupOptions = {
                    ...groupOptions,
                    groupBy: item as GroupOptions["groupBy"]
                  };
                  await updateGroupOptions(_groupOptions);
                }}
              >
                <Paragraph>
                  {strings.groupByStrings[
                    item as keyof typeof strings.groupByStrings
                  ]()}
                </Paragraph>

                {groupOptions.groupBy === item ? (
                  <AppIcon
                    size={AppFontSize.lg}
                    name="check"
                    color={colors.selected.accent}
                  />
                ) : null}
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
};

export default Sort;
