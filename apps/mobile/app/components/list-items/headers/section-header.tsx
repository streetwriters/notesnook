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
import { View } from "react-native";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import { presentSheet } from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { RouteName } from "../../../stores/use-navigation-store";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import Sort from "../../sheets/sort";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
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
    const isCompactModeEnabled = useIsCompactModeEnabled(
      dataType as "note" | "notebook"
    );

    return (
      <View
        style={{
          width: "100%",
          paddingHorizontal: DefaultAppStyles.GAP,
          marginBottom: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            alignSelf: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderColor: colors.primary.border,
            paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
          }}
        >
          <Pressable
            onPress={() => {
              onOpenJumpToDialog();
            }}
            hitSlop={{ top: 10, left: 10, right: 30, bottom: 15 }}
            style={{
              justifyContent: "flex-start",
              flexDirection: "row",
              width: "auto"
            }}
          >
            <Heading
              size={AppFontSize.xxs}
              style={{
                alignSelf: "center",
                textAlignVertical: "center"
              }}
              color={colors.primary.accent}
            >
              {!item.title || item.title === ""
                ? strings.pinned().toUpperCase()
                : item.title.toUpperCase()}
            </Heading>
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: DefaultAppStyles.GAP_SMALL
            }}
          >
            {index === 0 ? (
              <>
                <IconButton
                  name={
                    groupOptions.sortDirection === "asc"
                      ? "sort-ascending"
                      : "sort-descending"
                  }
                  color={colors.secondary.icon}
                  testID="icon-sort"
                  onPress={() => {
                    if (!screen) return;
                    presentSheet({
                      component: <Sort screen={screen} type={dataType} />
                    });
                  }}
                  style={{
                    width: 25,
                    height: 25
                  }}
                  size={AppFontSize.lg - 2}
                />
                <IconButton
                  hidden={
                    dataType !== "note" &&
                    dataType !== "notebook" &&
                    screen !== "Notes"
                  }
                  style={{
                    width: 25,
                    height: 25
                  }}
                  testID="icon-compact-mode"
                  color={colors.secondary.icon}
                  name={
                    isCompactModeEnabled ? "view-list" : "view-list-outline"
                  }
                  onPress={() => {
                    SettingsService.set({
                      [dataType !== "notebook"
                        ? "notesListMode"
                        : "notebooksListMode"]: !isCompactModeEnabled
                        ? "compact"
                        : "normal"
                    });
                  }}
                  size={AppFontSize.lg - 2}
                />
              </>
            ) : null}

            {/* <IconButton
              style={{
                width: 25,
                height: 25
              }}
              color={colors.secondary.icon}
              name={"chevron-down"}
              size={SIZE.lg - 2}
            /> */}
          </View>
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
