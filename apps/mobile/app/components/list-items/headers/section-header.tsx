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

import { GroupHeader, GroupOptions, ItemType } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import { presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { RouteName } from "../../../stores/use-navigation-store";
import { getContainerBorder } from "../../../utils/colors";
import { SIZE } from "../../../utils/size";
import Sort from "../../sheets/sort";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";

type SectionHeaderProps = {
  item: GroupHeader;
  index: number;
  dataType: ItemType;
  color?: string;
  screen?: RouteName;
  groupOptions: GroupOptions;
  onOpenJumpToDialog: () => void;
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
    onOpenJumpToDialog
  }: SectionHeaderProps) {
    const { colors } = useThemeColors();
    const { fontScale } = useWindowDimensions();
    const groupBy = strings.groupByStrings[groupOptions.groupBy]();
    const isCompactModeEnabled = useIsCompactModeEnabled(
      dataType as "note" | "notebook"
    );

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "95%",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          height: 35 * fontScale,
          backgroundColor: colors.secondary.background,
          alignSelf: "center",
          borderRadius: 5,
          marginVertical: 5,
          ...getContainerBorder(colors.secondary.background, 0.8)
        }}
      >
        <TouchableOpacity
          onPress={() => {
            onOpenJumpToDialog();
          }}
          activeOpacity={0.9}
          hitSlop={{ top: 10, left: 10, right: 30, bottom: 15 }}
          style={{
            height: "100%",
            justifyContent: "center"
          }}
        >
          <Heading
            color={color || colors.primary.accent}
            size={SIZE.sm}
            style={{
              alignSelf: "center",
              textAlignVertical: "center"
            }}
          >
            {!item.title || item.title === "" ? strings.pinned() : item.title}
          </Heading>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          {index === 0 ? (
            <>
              <Button
                onPress={() => {
                  presentSheet({
                    component: <Sort screen={screen} type={dataType} />
                  });
                }}
                title={groupBy}
                icon={
                  groupOptions.sortDirection === "asc"
                    ? "sort-ascending"
                    : "sort-descending"
                }
                height={25}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 0,
                  backgroundColor: "transparent",
                  marginRight:
                    dataType === "note" ||
                    screen === "Notes" ||
                    dataType === "notebook"
                      ? 10
                      : 0
                }}
                type="plain"
                iconPosition="right"
              />

              <IconButton
                style={{
                  width: 25,
                  height: 25
                }}
                hidden={
                  dataType !== "note" &&
                  dataType !== "notebook" &&
                  screen !== "Notes"
                }
                testID="icon-compact-mode"
                color={colors.secondary.icon}
                name={isCompactModeEnabled ? "view-list" : "view-list-outline"}
                onPress={() => {
                  SettingsService.set({
                    [dataType !== "notebook"
                      ? "notesListMode"
                      : "notebooksListMode"]: !isCompactModeEnabled
                      ? "compact"
                      : "normal"
                  });
                }}
                size={SIZE.lg - 2}
              />
            </>
          ) : null}
        </View>
      </View>
    );
  },
  (prev, next) => {
    if (prev.item.title !== next.item.title) return false;
    if (prev.groupOptions?.groupBy !== next.groupOptions.groupBy) return false;
    if (prev.groupOptions?.sortDirection !== next.groupOptions.sortDirection)
      return false;
    if (prev.groupOptions?.sortBy !== next.groupOptions.sortBy) return false;

    return true;
  }
);
