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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { Dimensions, View } from "react-native";
import SwiperFlatList from "react-native-swiper-flatlist";
import { Action, ActionId } from "../../hooks/use-actions";
import { useStoredRef } from "../../hooks/use-stored-ref";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import AppIcon from "../ui/AppIcon";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
import { Radius, Spacing } from "../../common/design/spacing";

const TOP_BAR_ITEMS: ActionId[] = [
  "pin",
  "favorite",
  "archive",
  "lock-unlock",
  "publish",
  "local-only",
  "read-only",
  "pin-to-notifications",
  "spell-check"
];

const BOTTOM_BAR_ITEMS: ActionId[] = [
  "notebooks",
  "add-reminder",
  "history",
  "reminders",
  "attachments",
  "references",
  "copy",
  "share",
  "export",
  "copy-link",
  "duplicate",
  "launcher-shortcut",
  "expiry-date",
  "trash"
];

const PREFERENCE_ITEMS: ActionId[] = [
  "add-shortcut",
  "pin",
  "default-notebook",
  "default-tag",
  "default-homepage"
];

const COLUMN_BAR_ITEMS: ActionId[] = [
  "select",
  "add-notebook",
  // "edit-notebook",
  "move-notes",
  "move-notebook",
  "edit-reminder",
  "pin",
  "disable-reminder",
  "default-notebook",
  "default-tag",
  "default-homepage",
  "add-shortcut",
  "reorder",
  "rename-color",
  // "rename-tag",
  "launcher-shortcut",
  "copy-id",
  "copy-link",
  "restore",
  "trash",
  "delete"
];

export const Items = ({
  item,
  close,
  buttons,
  actions
}: {
  item: Item;
  close: () => void;
  buttons: Action[];
  actions: Action[];
}) => {
  const { colors } = useThemeColors();
  const topBarSorting = useStoredRef<{ [name: string]: number }>(
    "topbar-sorting-ref",
    {}
  );
  const dimensions = useSettingStore((state) => state.dimensions);
  const selectedActions = actions.filter((i) => !i.hidden);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const width = Math.min(dimensions.width, 600);

  const shouldShrink =
    Dimensions.get("window").fontScale > 1 && dimensions.width < 450;

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

  const preferenceItems = selectedActions
    .filter((item) => PREFERENCE_ITEMS.indexOf(item.id) > -1)
    .sort((a, b) =>
      PREFERENCE_ITEMS.indexOf(a.id) > PREFERENCE_ITEMS.indexOf(b.id) ? 1 : -1
    );

  const columnItems = selectedActions
    .filter(
      (item) =>
        COLUMN_BAR_ITEMS.indexOf(item.id) > -1 &&
        PREFERENCE_ITEMS.indexOf(item.id) === -1
    )
    .sort((a, b) =>
      COLUMN_BAR_ITEMS.indexOf(a.id) > COLUMN_BAR_ITEMS.indexOf(b.id) ? 1 : -1
    );

  const actionItems = [...buttons, ...columnItems];

  const renderRowItem = React.useCallback(
    ({ item }: { item: Action }) => (
      <View
        key={item.id}
        style={{
          alignItems: "center",
          width: columnItemWidth - 10,
          opacity: item.locked ? 0.5 : 1
        }}
      >
        <Pressable
          onPress={item.onPress}
          type={item.checked ? "shade" : "secondary"}
          testID={"icon-" + item.id}
          style={{
            width: columnItemWidth - 10,
            paddingVertical: Spacing.LEVEL_2,
            borderRadius: 10,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 6
          }}
        >
          <AppIcon
            allowFontScaling
            name={item.icon}
            iconFamily="notesnook"
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

  const renderPreferenceItem = React.useCallback(
    (item: Action) => (
      <Pressable
        key={item.id}
        onPress={item.onPress}
        type={item.checked ? "shade" : "transparent"}
        testID={"icon-" + item.id}
        style={{
          width: "48.5%",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: Spacing.LEVEL_1,
          paddingVertical: Spacing.LEVEL_2,
          paddingHorizontal: Spacing.LEVEL_2,
          borderRadius: Radius.XS,
          borderWidth: item.checked ? 0 : 1,
          borderColor: colors.primary.border,
          opacity: item.locked ? 0.7 : 1
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_1,
            flexShrink: 1
          }}
        >
          <AppIcon
            name={item.icon}
            iconFamily="notesnook"
            allowFontScaling
            size={AppFontSize.md}
            color={item.checked ? colors.primary.icon : colors.secondary.icon}
          />
          <Paragraph
            numberOfLines={1}
            fontSize="XS"
            fontFamily="MEDIUM"
            color={
              item.checked
                ? colors.primary.paragraph
                : colors.secondary.paragraph
            }
            style={{ flexShrink: 1 }}
          >
            {item.title}
          </Paragraph>
        </View>

        <AppIcon
          name={item.checked ? "toggle-on" : "toggle-off"}
          iconFamily="notesnook"
          size={16}
          color={
            item.checked
              ? [colors.primary.accent, colors.primary.background]
              : [colors.disabled.icon, colors.primary.background]
          }
        />
      </Pressable>
    ),
    [
      colors.disabled.icon,
      colors.primary.accent,
      colors.primary.background,
      colors.primary.border,
      colors.primary.icon,
      colors.primary.paragraph,
      colors.secondary.icon,
      colors.secondary.paragraph
    ]
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
            width: columnItemWidth - 10,
            alignSelf: "flex-start",
            gap: DefaultAppStyles.GAP_VERTICAL_SMALL
          }}
        >
          <View
            style={{
              height: columnItemWidth / 2,
              width: 65,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: item.checked
                ? colors.primary.shade
                : colors.secondary.background,
              borderRadius: Radius.XS,
              overflow: "hidden",
              paddingVertical: Spacing.LEVEL_2,
              paddingHorizontal: Spacing.LEVEL_2
            }}
          >
            <AppIcon
              name={item.icon}
              iconFamily="notesnook"
              allowFontScaling
              size={16}
              color={
                item.checked
                  ? colors.primary.icon
                  : item.id === "delete" || item.id === "trash"
                    ? colors.error.icon
                    : colors.secondary.icon
              }
            />

            {item.locked ? (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 100,
                  backgroundColor: colors.primary.accent,
                  justifyContent: "center",
                  alignItems: "center",
                  position: "absolute",
                  bottom: -3,
                  right: -3
                }}
              >
                <AppIcon
                  color={colors.static.orange}
                  size={AppFontSize.xxxs}
                  name="crown"
                />
              </View>
            ) : null}
          </View>

          <Paragraph
            textBreakStrategy="simple"
            fontSize="XXS"
            fontFamily="MEDIUM"
            color={
              item.checked
                ? colors.primary.paragraph
                : colors.secondary.paragraph
            }
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
      colors.primary.icon,
      colors.primary.paragraph,
      colors.primary.shade,
      colors.secondary.background,
      colors.secondary.icon,
      colors.secondary.paragraph,
      colors.static.orange,
      columnItemWidth,
      topBarSorting
    ]
  );

  const getTopBarItemChunksOfFour = () => {
    const chunks = [];
    const itemCount = shouldShrink ? 4 : 5;
    for (let i = 0; i < topBarItems.length; i += itemCount) {
      chunks.push(topBarItems.slice(i, i + itemCount));
    }
    return chunks;
  };

  return (
    <View>
      {item.type === "note" ? (
        <>
          <View>
            <SwiperFlatList
              data={getTopBarItemChunksOfFour()}
              autoplay={false}
              showPagination
              paginationStyleItemActive={{
                borderRadius: 6,
                backgroundColor: colors.selected.accent,
                height: 5,
                width: 20,
                marginHorizontal: 3
              }}
              paginationStyleItemInactive={{
                borderRadius: 6,
                backgroundColor: colors.secondary.background,
                height: 5,
                width: 14,
                marginHorizontal: 3
              }}
              paginationStyle={{
                position: "relative",
                marginHorizontal: 2,
                marginBottom: -10,
                marginTop: 10
              }}
              contentContainerStyle={{
                justifyContent: "flex-start",
                alignItems: "flex-start",
                alignSelf: "flex-start"
              }}
              centerContent={false}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: DefaultAppStyles.GAP,
                    gap: Spacing.LEVEL_2,
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
              gap: Spacing.LEVEL_1,
              paddingHorizontal: DefaultAppStyles.GAP
            }}
          >
            {bottomGridItems.map((item) => renderRowItem({ item }))}
          </View>
        </>
      ) : (
        <View
          style={{
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          {preferenceItems.length > 0 ? (
            <View style={{ gap: Spacing.LEVEL_2 }}>
              <Paragraph
                fontFamily="MEDIUM"
                fontSize="SM"
                color={colors.secondary.paragraph}
              >
                {strings.preferences()}
              </Paragraph>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.LEVEL_1
                }}
              >
                {preferenceItems.map(renderPreferenceItem)}
              </View>
            </View>
          ) : null}

          <View
            style={{
              marginVertical: Spacing.LEVEL_3,
              width: "100%",
              borderBottomWidth: 1,
              borderColor: colors.primary.separator
            }}
          />

          {actionItems.length > 0 ? (
            <View style={{ gap: Spacing.LEVEL_2 }}>
              <Paragraph
                fontFamily="MEDIUM"
                fontSize="SM"
                color={colors.secondary.paragraph}
              >
                {strings.actionsHeading()}
              </Paragraph>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.LEVEL_1
                }}
              >
                {actionItems.map((item) => renderRowItem({ item }))}
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};
