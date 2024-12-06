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

import { Item } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Action, ActionId, useActions } from "../../hooks/use-actions";
import { useStoredRef } from "../../hooks/use-stored-ref";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Button } from "../ui/button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";

const TOP_BAR_ITEMS: ActionId[] = [
  "pin",
  "favorite",
  "copy",
  "share",
  "lock-unlock",
  "publish",
  "export",
  "copy-link",
  "duplicate",
  "local-only",
  "read-only"
];

const BOTTOM_BAR_ITEMS: ActionId[] = [
  "notebooks",
  "add-reminder",
  "pin-to-notifications",
  "history",
  "reminders",
  "attachments",
  "references",
  "trash"
];

const COLUMN_BAR_ITEMS: ActionId[] = [
  "select",
  "add-notebook",
  "edit-notebook",
  "move-notes",
  "move-notebook",
  "pin",
  "default-notebook",
  "add-shortcut",
  "trash"
];

export const Items = ({ item, close }: { item: Item; close: () => void }) => {
  const { colors } = useThemeColors();
  const topBarSorting = useStoredRef<{ [name: string]: number }>(
    "topbar-sorting-ref",
    {}
  );
  const dimensions = useSettingStore((state) => state.dimensions);
  const actions = useActions({ item, close });
  const selectedActions = actions.filter((i) => !i.hidden);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const width = Math.min(dimensions.width, 600);

  const shouldShrink =
    Dimensions.get("window").fontScale > 1 &&
    Dimensions.get("window").width < 450;

  const columnItemsCount = deviceMode === "tablet" ? 7 : shouldShrink ? 4 : 5;

  const columnItemWidth =
    deviceMode !== "mobile"
      ? (width - 16) / columnItemsCount
      : (width - 16) / columnItemsCount;

  const topBarItems = selectedActions
    .filter((item) => TOP_BAR_ITEMS.indexOf(item.id) > -1)
    .sort((a, b) =>
      TOP_BAR_ITEMS.indexOf(a.id) > TOP_BAR_ITEMS.indexOf(b.id) ? 1 : -1
    )
    .sort((a, b) => {
      return (
        (topBarSorting.current[b.id] || 0) - (topBarSorting.current[a.id] || 0)
      );
    });

  const bottomGridItems = selectedActions
    .filter((item) => BOTTOM_BAR_ITEMS.indexOf(item.id) > -1)
    .sort((a, b) =>
      BOTTOM_BAR_ITEMS.indexOf(a.id) > BOTTOM_BAR_ITEMS.indexOf(b.id) ? 1 : -1
    );

  const columnItems = selectedActions
    .filter((item) => COLUMN_BAR_ITEMS.indexOf(item.id) > -1)
    .sort((a, b) =>
      COLUMN_BAR_ITEMS.indexOf(a.id) > COLUMN_BAR_ITEMS.indexOf(b.id) ? 1 : -1
    );

  const topBarItemHeight = Math.min(
    (width - (topBarItems.length * 10 + 14)) / topBarItems.length,
    60
  );

  const renderRowItem = React.useCallback(
    ({ item }: { item: Action }) => (
      <View
        key={item.id}
        testID={"icon-" + item.id}
        style={{
          alignItems: "center",
          width: columnItemWidth - 8
        }}
      >
        <Pressable
          onPress={item.onPress}
          type={item.checked ? "shade" : "secondary"}
          style={{
            height: columnItemWidth - 8,
            width: columnItemWidth - 8,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: DDS.isTab ? 7 : 3.5
          }}
        >
          <Icon
            allowFontScaling
            name={item.icon}
            size={DDS.isTab ? SIZE.xxl : shouldShrink ? SIZE.xxl : SIZE.lg}
            color={
              item.checked
                ? item.activeColor || colors.primary.accent
                : item.id.match(/(delete|trash)/g)
                ? colors.error.icon
                : colors.secondary.icon
            }
          />
        </Pressable>

        <Paragraph
          size={SIZE.xxs}
          textBreakStrategy="simple"
          style={{ textAlign: "center" }}
        >
          {item.title}
        </Paragraph>
      </View>
    ),
    [
      colors.error.icon,
      colors.primary.accent,
      colors.secondary.icon,
      columnItemWidth,
      shouldShrink
    ]
  );

  const renderColumnItem = React.useCallback(
    (item: Action) => (
      <Button
        key={item.id}
        buttonType={{
          text: item.checked
            ? item.activeColor || colors.primary.accent
            : item.id === "delete" || item.id === "trash"
            ? colors.error.paragraph
            : colors.primary.paragraph
        }}
        onPress={item.onPress}
        title={item.title}
        icon={item.icon}
        type={item.checked ? "inverted" : "plain"}
        fontSize={SIZE.sm}
        style={{
          borderRadius: 0,
          justifyContent: "flex-start",
          alignSelf: "flex-start",
          width: "100%"
        }}
      />
    ),
    [colors.error.paragraph, colors.primary.accent, colors.primary.paragraph]
  );

  const renderTopBarItem = React.useCallback(
    (item: Action) => {
      return (
        <Pressable
          onPress={() => {
            item.onPress();
            setImmediate(() => {
              const currentValue = topBarSorting.current[item.id] || 0;
              topBarSorting.current = {
                ...topBarSorting.current,
                [item.id]: currentValue + 1
              };
            });
          }}
          key={item.id}
          testID={"icon-" + item.id}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 0,
            flex: 1
          }}
        >
          <View
            style={{
              height: topBarItemHeight,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: DDS.isTab ? 7 : 3.5,
              borderRadius: 100
            }}
          >
            <Icon
              name={item.icon}
              allowFontScaling
              size={DDS.isTab ? SIZE.xxl : SIZE.md + 4}
              color={
                item.checked
                  ? item.activeColor || colors.primary.accent
                  : item.id === "delete" || item.id === "trash"
                  ? colors.error.icon
                  : colors.secondary.icon
              }
            />
          </View>

          <Paragraph
            textBreakStrategy="simple"
            size={SIZE.xxs}
            style={{ textAlign: "center" }}
          >
            {item.title}
          </Paragraph>
        </Pressable>
      );
    },
    [
      colors.error.icon,
      colors.primary.accent,
      colors.secondary.icon,
      topBarItemHeight,
      topBarSorting
    ]
  );

  return item.type === "note" ? (
    <>
      <ScrollView
        horizontal
        style={{
          paddingHorizontal: 16,
          marginTop: 6,
          marginBottom: 6
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingRight: 25,
          gap: 15
        }}
      >
        {topBarItems.map(renderTopBarItem)}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 10,
          gap: 5,
          paddingHorizontal: DefaultAppStyles.GAP
        }}
      >
        {bottomGridItems.map((item) => renderRowItem({ item }))}
      </View>
    </>
  ) : (
    <View>{columnItems.map(renderColumnItem)}</View>
  );
};
