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
  GroupHeader,
  GroupingKey,
  GroupOptions,
  Item,
  ItemType,
  SortOptions,
  VirtualizedGrouping
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
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
import { Radius, Spacing } from "../../../common/design/spacing";
import { getElevationStyle } from "../../../utils/elevation";
import { useMessageStore } from "../../../stores/use-message-store";

const Sort = ({
  type,
  screen,
  hideGroupOptions,
  group: groupType,
  hideJumpToSection,
  ref,
  data
}: {
  type: ItemType;
  screen?: RouteName;
  group: GroupingKey;
  hideGroupOptions?: boolean;
  hideJumpToSection?: boolean;
  data?: VirtualizedGrouping<Item>;
  ref?: RefObject<FlatList>;
}) => {
  const { colors } = useThemeColors();
  const [groups, setGroups] = useState<
    {
      index: number;
      group: GroupHeader;
    }[]
  >();
  const offsets = useRef<number[]>([]);
  const scrollRef = useRef<RefObject<FlatList>>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScrollPosition = useRef(0);

  const [groupOptions, setGroupOptions] = useState(
    db.settings.getGroupOptions(groupType)
  );

  const getSortButtonTitle = (type: "asc" | "desc") => {
    const { groupBy, sortBy } = groupOptions || {};
    const isAlphabetical = groupBy === "abc" || sortBy === "title";
    const isDueDate = sortBy === "dueDate";
    const isRelevance = sortBy === "relevance";

    if (type === "asc") {
      if (isAlphabetical) return strings.aToZ();
      if (isDueDate) return strings.earliestFirst();
      if (isRelevance) return strings.leastRelevantFirst();
      return strings.oldestFirst();
    } else {
      if (isAlphabetical) return strings.zToA();
      if (isDueDate) return strings.latestFirst();
      if (isRelevance) return strings.mostRelevantFirst();
      return strings.newestFirst();
    }
  };

  const updateGroupOptions = async (_groupOptions: GroupOptions) => {
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

  useEffect(() => {
    data?.groups?.().then((groups) => {
      setGroups(groups);
      offsets.current = [];
      groups.map((item, index) => {
        let offset = 35 * index;
        let groupIndex = item.index;
        const messageState = useMessageStore.getState().message;
        const msgOffset = messageState?.visible ? 60 : 10;

        groupIndex = groupIndex + 1;
        groupIndex = groupIndex - (index + 1);
        offset = offset + groupIndex * 100 + msgOffset;
        offsets.current.push(offset);
      });

      const index = offsets.current?.findIndex((o, i) => {
        return (
          o <= currentScrollPosition.current + 100 &&
          offsets.current[i + 1] - 100 > currentScrollPosition.current
        );
      });

      setCurrentIndex(index < 0 ? 0 : index);
    });
  }, [data]);

  const onPress = (item: { index: number; group: GroupHeader }) => {
    scrollRef.current?.current?.scrollToIndex({
      index: item.index,
      animated: true
    });
    close();
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        justifyContent: "space-between",
        gap: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_3
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: DefaultAppStyles.GAP
        }}
      >
        <Heading fontSize="LG">{strings.sortBy()}</Heading>

        {/* <Button
          title={getSortButtonTitle()}
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
        /> */}
      </View>

      <View
        style={{
          flexDirection: "column",
          justifyContent: "flex-start",
          borderBottomColor: colors.primary.border,
          paddingHorizontal: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_3
        }}
      >
        {Object.keys(SORT).map((item) => {
          const sortOptionVisibility = {
            dateCreated: groupType !== "trash",
            relevance: groupType === "search",
            dueDate: groupType === "reminders",
            dateModified: groupType === "reminders" || groupType === "tags",
            dateEdited:
              groupType !== "tags" &&
              groupType !== "reminders" &&
              groupType !== "trash",
            dateDeleted: groupType === "trash"
          };

          // Check if this sort option should be skipped for the current screen
          const shouldSkip =
            item in sortOptionVisibility &&
            !sortOptionVisibility[item as keyof typeof sortOptionVisibility];

          if (shouldSkip) {
            return null;
          }

          return (
            <View
              key={item}
              style={{
                gap: Spacing.LEVEL_2
              }}
            >
              <Pressable
                type={
                  groupOptions?.sortBy === item ? "selected" : "plain-outline"
                }
                style={{
                  width: "100%",
                  justifyContent: "space-between",
                  flexDirection: "row",
                  borderRadius: Radius.XS,
                  paddingHorizontal: Spacing.LEVEL_2,
                  paddingVertical: Spacing.LEVEL_2
                }}
                onPress={async () => {
                  const _groupOptions: GroupOptions = {
                    ...groupOptions,
                    sortBy: item as SortOptions["sortBy"]
                  };
                  await updateGroupOptions(_groupOptions);
                }}
              >
                <Paragraph>
                  {strings.sortByStrings[
                    item as keyof typeof strings.sortByStrings
                  ]()}
                </Paragraph>

                {groupOptions?.sortBy === item ? (
                  <AppIcon
                    size={AppFontSize.lg}
                    name="checkbox"
                    iconFamily="notesnook"
                    color={[colors.selected.accent, "white"]}
                  />
                ) : null}
              </Pressable>

              {groupOptions.sortBy === item ? (
                <View
                  style={{
                    backgroundColor: colors.secondary.background,
                    borderRadius: Radius.S,
                    padding: Spacing.LEVEL_1,
                    flexDirection: "row",
                    gap: Spacing.LEVEL_2
                  }}
                >
                  <Button
                    style={{
                      flexGrow: 1,
                      borderRadius: Radius.XS,
                      ...(groupOptions?.sortDirection === "desc"
                        ? getElevationStyle(10)
                        : {})
                    }}
                    type={
                      groupOptions?.sortDirection === "desc"
                        ? "accent-background"
                        : "plain"
                    }
                    title={getSortButtonTitle("desc")}
                    onPress={() => {
                      const _groupOptions: GroupOptions = {
                        ...groupOptions,
                        sortDirection: "desc"
                      };
                      updateGroupOptions(_groupOptions);
                    }}
                  />

                  <Button
                    style={{
                      flexGrow: 1,
                      borderRadius: Radius.XS,
                      ...(groupOptions?.sortDirection === "asc"
                        ? getElevationStyle(10)
                        : {})
                    }}
                    type={
                      groupOptions?.sortDirection === "asc"
                        ? "accent-background"
                        : "plain"
                    }
                    title={getSortButtonTitle("asc")}
                    onPress={() => {
                      const _groupOptions: GroupOptions = {
                        ...groupOptions,
                        sortDirection: "asc"
                      };
                      updateGroupOptions(_groupOptions);
                    }}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {!hideGroupOptions ? (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: Spacing.LEVEL_3,
              paddingBottom: Spacing.LEVEL_3
            }}
          >
            <Heading fontSize="LG">{strings.groupBy()}</Heading>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: Spacing.LEVEL_3,
              gap: Spacing.LEVEL_2
            }}
          >
            {Object.keys(GROUP).map((item) => (
              <Pressable
                key={item}
                type={
                  groupOptions?.groupBy === GROUP[item as keyof typeof GROUP]
                    ? "selected"
                    : "plain-outline"
                }
                style={{
                  flexDirection: "row",
                  width: "auto",
                  borderRadius: 100,
                  paddingHorizontal: Spacing.LEVEL_3,
                  paddingVertical: Spacing.LEVEL_1
                }}
                onPress={async () => {
                  const _groupOptions: GroupOptions = {
                    ...groupOptions,
                    groupBy: item as GroupOptions["groupBy"]
                  };
                  await updateGroupOptions(_groupOptions);
                }}
              >
                <Paragraph
                  fontFamily={
                    groupOptions?.groupBy === GROUP[item as keyof typeof GROUP]
                      ? "SEMI_BOLD"
                      : "REGULAR"
                  }
                  color={
                    groupOptions?.groupBy === GROUP[item as keyof typeof GROUP]
                      ? colors.primary.paragraph
                      : colors.secondary.paragraph
                  }
                >
                  {strings.groupByStrings[
                    item as keyof typeof strings.groupByStrings
                  ]()}
                </Paragraph>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      {!hideJumpToSection && groups ? (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: Spacing.LEVEL_3,
              paddingBottom: Spacing.LEVEL_3
            }}
          >
            <Heading fontSize="LG">{strings.jumpToGroup()}</Heading>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: Spacing.LEVEL_3,
              gap: Spacing.LEVEL_2
            }}
          >
            {groups?.map((item, index) => {
              return (
                <Pressable
                  key={item.group.id}
                  onPress={() => onPress(item)}
                  type={currentIndex === index ? "selected" : "plain-outline"}
                  style={{
                    minWidth: "20%",
                    width: null,
                    borderRadius: 100,
                    paddingHorizontal: Spacing.LEVEL_3,
                    paddingVertical: Spacing.LEVEL_1
                  }}
                >
                  <Paragraph
                    size={AppFontSize.sm}
                    fontFamily={
                      currentIndex === index ? "SEMI_BOLD" : "REGULAR"
                    }
                    color={colors.primary.paragraph}
                    style={{
                      textAlign: "center"
                    }}
                  >
                    {item.group.title}
                  </Paragraph>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
};

export default Sort;
