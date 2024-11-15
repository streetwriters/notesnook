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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { Dimensions, ScrollView, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useActions } from "../../hooks/use-actions";
import { useStoredRef } from "../../hooks/use-stored-ref";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import { Pressable } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";

export const Items = ({ item, buttons, close }) => {
  const { colors } = useThemeColors();
  const topBarSorting = useStoredRef("topbar-sorting-ref", {});

  const dimensions = useSettingStore((state) => state.dimensions);
  const actions = useActions({ item, close });
  const data = actions.filter((i) => buttons.indexOf(i.id) > -1 && !i.hidden);
  let width = dimensions.width > 600 ? 600 : dimensions.width;
  const shouldShrink =
    Dimensions.get("window").fontScale > 1 &&
    Dimensions.get("window").width < 450;
  let columnItemsCount = DDS.isLargeTablet() ? 7 : shouldShrink ? 4 : 5;
  let columnItemWidth = DDS.isTab
    ? (width - 12) / columnItemsCount
    : (width - 12) / columnItemsCount;

  const _renderRowItem = ({ item }) => (
    <View
      key={item.id}
      testID={"icon-" + item.id}
      style={{
        alignItems: "center",
        width: columnItemWidth,
        marginBottom: 10
      }}
    >
      <Pressable
        onPress={item.func}
        type={item.on ? "shade" : "secondary"}
        style={{
          height: columnItemWidth - 12,
          width: columnItemWidth - 12,
          borderRadius: 10,
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          textAlignVertical: "center",
          marginBottom: DDS.isTab ? 7 : 3.5
        }}
      >
        <Icon
          allowFontScaling
          name={item.icon}
          size={DDS.isTab ? SIZE.xxl : shouldShrink ? SIZE.xxl : SIZE.lg}
          color={
            item.on
              ? colors.primary.accent
              : item.id.match(/(delete|trash)/g)
              ? colors.error.icon
              : colors.secondary.icon
          }
        />
      </Pressable>

      <Paragraph
        size={SIZE.xs}
        textBreakStrategy="simple"
        style={{ textAlign: "center" }}
      >
        {item.title}
      </Paragraph>
    </View>
  );

  const renderColumnItem = (item) => (
    <Button
      key={item.name + item.title}
      buttonType={{
        text: item.on
          ? colors.primary.accent
          : item.name === "Delete" || item.name === "PermDelete"
          ? colors.error.paragraph
          : colors.primary.paragraph
      }}
      onPress={item.func}
      title={item.title}
      icon={item.icon}
      type={item.on ? "shade" : "plain"}
      fontSize={SIZE.sm}
      style={{
        borderRadius: 0,
        justifyContent: "flex-start",
        alignSelf: "flex-start",
        width: "100%"
      }}
    />
  );

  const renderTopBarItem = (item, index) => {
    return (
      <Pressable
        onPress={() => {
          item.func();
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
        activeOpacity={1}
        style={{
          alignSelf: "flex-start",
          paddingHorizontal: 0,
          flex: 1
        }}
      >
        <View
          onPress={item.func}
          style={{
            height: topBarItemWidth,
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            textAlignVertical: "center",
            marginBottom: DDS.isTab ? 7 : 3.5,
            borderRadius: 100
          }}
        >
          <Icon
            name={item.icon}
            allowFontScaling
            size={DDS.isTab ? SIZE.xxl : SIZE.md + 4}
            color={
              item.on
                ? colors.primary.accent
                : item.name === "Delete" || item.name === "PermDelete"
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
  };

  const topBarItemsList = [
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

  const bottomBarItemsList = [
    "notebooks",
    "add-reminder",
    "pin-to-notifications",
    "history",
    "reminders",
    "attachments",
    "references",
    "trash"
  ];

  const topBarItems = data
    .filter((item) => topBarItemsList.indexOf(item.id) > -1)
    .sort((a, b) =>
      topBarItemsList.indexOf(a.id) > topBarItemsList.indexOf(b.id) ? 1 : -1
    )
    .sort((a, b) => {
      return (
        (topBarSorting.current[b.id] || 0) - (topBarSorting.current[a.id] || 0)
      );
    });

  const bottomGridItems = data
    .filter((item) => bottomBarItemsList.indexOf(item.id) > -1)
    .sort((a, b) =>
      bottomBarItemsList.indexOf(a.id) > bottomBarItemsList.indexOf(b.id)
        ? 1
        : -1
    );

  let topBarItemWidth =
    (width - (topBarItems.length * 10 + 14)) / topBarItems.length;
  topBarItemWidth;

  if (topBarItemWidth < 60) {
    topBarItemWidth = 60;
  }

  return item.type === "note" ? (
    <>
      <ScrollView
        horizontal
        style={{
          paddingHorizontal: 12,
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
          alignContent: "flex-start",
          marginTop: item.type !== "note" ? 10 : 0,
          paddingTop: 10,
          marginLeft: 6
        }}
      >
        {bottomGridItems.map((item) => _renderRowItem({ item }))}
      </View>
    </>
  ) : (
    <View data={data}>{data.map(renderColumnItem)}</View>
  );
};
