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
import { Dimensions, View } from "react-native";
import SwiperFlatList from "react-native-swiper-flatlist";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Action, ActionId, useActions } from "../../hooks/use-actions";
import { useStoredRef } from "../../hooks/use-stored-ref";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";
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
  "reorder",
  "rename-color",
  "rename-tag",
  "restore",
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
      ? (width - DefaultAppStyles.GAP) / columnItemsCount
      : (width - DefaultAppStyles.GAP) / columnItemsCount;

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
        style={{
          alignItems: "center",
          width: columnItemWidth - 8
        }}
      >
        <Pressable
          onPress={item.onPress}
          type={item.checked ? "shade" : "secondary"}
          testID={"icon-" + item.id}
          style={{
            height: columnItemWidth / 1.5,
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
            size={
              DDS.isTab
                ? AppFontSize.xxl
                : shouldShrink
                ? AppFontSize.xxl
                : AppFontSize.lg
            }
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
          size={AppFontSize.xxs}
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
        testID={"icon-" + item.id}
        onPress={item.onPress}
        title={item.title}
        icon={item.icon}
        type={item.checked ? "inverted" : "plain"}
        fontSize={AppFontSize.sm}
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
            width: columnItemWidth - 8
          }}
        >
          <View
            style={{
              height: columnItemWidth / 2,
              width: columnItemWidth - DefaultAppStyles.GAP_SMALL,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Icon
              name={item.icon}
              allowFontScaling
              size={DDS.isTab ? AppFontSize.xxl : AppFontSize.md + 4}
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
            size={AppFontSize.xxs}
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
      columnItemWidth,
      topBarSorting
    ]
  );

  const getTopBarItemChunksOfFour = () => {
    const chunks = [];
    for (let i = 0; i < topBarItems.length; i += 5) {
      chunks.push(topBarItems.slice(i, i + 5));
    }
    return chunks;
  };

  return (
    <View
      style={{
        gap: DefaultAppStyles.GAP
      }}
    >
      {item.type === "note" ? (
        <>
          <View>
            <SwiperFlatList
              data={getTopBarItemChunksOfFour()}
              autoplay={false}
              showPagination
              paginationStyleItemActive={{
                borderRadius: 2,
                backgroundColor: colors.selected.background,
                height: 6,
                marginHorizontal: 2
              }}
              paginationStyleItemInactive={{
                borderRadius: 2,
                backgroundColor: colors.secondary.background,
                height: 6,
                marginHorizontal: 2
              }}
              paginationStyle={{
                position: "relative",
                marginHorizontal: 2,
                marginBottom: 0,
                marginTop: DefaultAppStyles.GAP
              }}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: DefaultAppStyles.GAP,
                    gap: 5,
                    width: width
                  }}
                >
                  {item.map(renderTopBarItem)}
                </View>
              )}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 5,
              paddingHorizontal: DefaultAppStyles.GAP
            }}
          >
            {bottomGridItems.map((item) => renderRowItem({ item }))}
          </View>
        </>
      ) : (
        <View>{columnItems.map(renderColumnItem)}</View>
      )}
    </View>
  );
};
