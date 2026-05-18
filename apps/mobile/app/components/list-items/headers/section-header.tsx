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
  ItemType,
  Item,
  VirtualizedGrouping
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject } from "react";
import { FlatList, View } from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import { presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { RouteName } from "../../../stores/use-navigation-store";
import Sort from "../../sheets/sort";
import { IconButton } from "../../ui/icon-button";
import Paragraph from "../../ui/typography/paragraph";

type SectionHeaderProps = {
  item: GroupHeader;
  index: number;
  dataType: ItemType;
  color?: string;
  screen?: RouteName;
  groupOptions: GroupOptions;
  group: GroupingKey;
  itemCount?: number;
  // onOpenJumpToDialog: () => void;
  data?: VirtualizedGrouping<Item>;
  ref?: RefObject<FlatList>;
};

export const SectionHeader = React.memo<
  React.FunctionComponent<SectionHeaderProps>
>(
  function SectionHeader({
    item,
    index,
    dataType,
    color,
    screen,
    groupOptions,
    group,
    itemCount,
    data,
    ref
  }: SectionHeaderProps) {
    const { colors } = useThemeColors("list");
    const isCompactModeEnabled = useIsCompactModeEnabled(
      dataType as "note" | "notebook" | "searchResult"
    );

    return (
      <View
        style={{
          width: "100%",
          paddingHorizontal: Spacing.LEVEL_3,
          marginBottom: Spacing.LEVEL_3,
          marginTop: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            alignSelf: "center",
            justifyContent: "space-between"
          }}
        >
          <Paragraph
            fontSize="MD"
            style={{
              alignSelf: "center",
              textAlignVertical: "center"
            }}
            color={colors.secondary.heading}
          >
            {!item.title || item.title === ""
              ? screen === "Search"
                ? strings.results(itemCount || 0)
                : strings.pinned()
              : item.title}
          </Paragraph>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.LEVEL_1
            }}
          >
            {index === 0 ? (
              <>
                <IconButton
                  name={"sliders"}
                  iconFamily="notesnook"
                  color={colors.secondary.icon}
                  testID="icon-sort"
                  onPress={() => {
                    if (!screen) return;
                    presentSheet({
                      component: (
                        <Sort
                          screen={screen}
                          type={dataType}
                          group={group}
                          hideGroupOptions={
                            screen === "Reminders" || screen === "Search"
                          }
                          data={data}
                          ref={ref}
                        />
                      )
                    });
                  }}
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderRadius: Radius.XS,
                    borderColor: colors.secondary.border
                  }}
                  size={16}
                />
                <IconButton
                  hidden={
                    dataType !== "note" &&
                    dataType !== "notebook" &&
                    screen !== "Notes" &&
                    screen !== "Search"
                  }
                  style={{
                    width: 30,
                    height: 30,
                    borderWidth: 1,
                    borderRadius: Radius.XXS,
                    borderColor: colors.secondary.border
                  }}
                  testID="icon-compact-mode"
                  color={colors.secondary.icon}
                  name={"view-list"}
                  iconFamily="notesnook"
                  onPress={() => {
                    SettingsService.set({
                      [dataType === "notebook"
                        ? "notebooksListMode"
                        : dataType === "searchResult"
                          ? "searchListMode"
                          : "notesListMode"]: !isCompactModeEnabled
                        ? "compact"
                        : "normal"
                    });
                  }}
                  size={16}
                />
              </>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
  (prev, next) => {
    if (prev.item.title !== next.item.title) return false;
    if (prev.itemCount !== next.itemCount) return false;
    if (prev.groupOptions?.groupBy !== next.groupOptions.groupBy) return false;
    if (prev.groupOptions?.sortDirection !== next.groupOptions.sortDirection)
      return false;
    if (prev.groupOptions?.sortBy !== next.groupOptions.sortBy) return false;

    return true;
  }
);
