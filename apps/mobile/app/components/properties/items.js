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

import React from "react";
import { FlatList, ScrollView, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useActions } from "../../hooks/use-actions";
import { DDS } from "../../services/device-detection";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import { PressableButton } from "../ui/pressable";
import Paragraph from "../ui/typography/paragraph";
export const Items = ({ item, buttons, close }) => {
  const { colors } = useThemeColors();
  const dimensions = useSettingStore((state) => state.dimensions);
  const actions = useActions({ item, close });
  const data = actions.filter((i) => buttons.indexOf(i.id) > -1 && !i.hidden);

  let width = dimensions.width > 600 ? 600 : dimensions.width;
  let columnItemsCount = DDS.isLargeTablet() ? 7 : 5;
  let columnItemWidth = DDS.isTab
    ? (width - 12) / columnItemsCount
    : (width - 12) / columnItemsCount;

  const _renderRowItem = ({ item }) => (
    <View
      onPress={item.func}
      key={item.id}
      testID={"icon-" + item.id}
      style={{
        alignItems: "center",
        width: columnItemWidth,
        marginBottom: 10
      }}
    >
      <PressableButton
        onPress={item.func}
        type={item.on ? "shade" : "grayBg"}
        customStyle={{
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
          name={item.icon}
          size={DDS.isTab ? SIZE.xxl : SIZE.lg}
          color={
            item.on
              ? colors.primary.accent
              : item.id.match(/(delete|trash)/g)
              ? colors.error.icon
              : colors.primary.icon
          }
        />
      </PressableButton>

      <Paragraph size={SIZE.xs} style={{ textAlign: "center" }}>
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
      type={item.on ? "shade" : "gray"}
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
    const isLast = index === topBarItems.length;
    return (
      <PressableButton
        onPress={item.func}
        key={item.id}
        testID={"icon-" + item.id}
        activeOpacity={1}
        customStyle={{
          alignSelf: "flex-start",
          marginRight: isLast ? 0 : 10,
          paddingHorizontal: 0,
          width: topBarItemWidth
        }}
      >
        <PressableButton
          onPress={item.func}
          type={item.on ? "shade" : "gray"}
          customStyle={{
            height: topBarItemWidth,
            width: topBarItemWidth,
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
            size={DDS.isTab ? SIZE.xxl : SIZE.md + 4}
            color={
              item.on
                ? colors.accent
                : item.name === "Delete" || item.name === "PermDelete"
                ? colors.errorText
                : colors.icon
            }
          />
        </PressableButton>

        <Paragraph size={SIZE.xxs + 1} style={{ textAlign: "center" }}>
          {item.title}
        </Paragraph>
      </PressableButton>
    );
  };

  const topBarItemsList = [
    "pin",
    "favorite",
    "copy",
    "share",
    "export",
    "lock-unlock",
    "publish"
  ];
  const topBarItems = data.filter(
    (item) => topBarItemsList.indexOf(item.id) > -1
  );

  const bottomGridItems = data.filter(
    (item) => topBarItemsList.indexOf(item.id) === -1
  );

  const topBarItemWidth =
    (width - (topBarItems.length * 10 + 14)) / topBarItems.length;

  return item.type === "note" ? (
    <>
      <ScrollView
        horizontal
        style={{
          paddingHorizontal: 12,
          paddingVertical: 12
        }}
      >
        {topBarItems.map(renderTopBarItem)}
      </ScrollView>

      <FlatList
        data={bottomGridItems}
        keyExtractor={(item) => item.title}
        key={columnItemsCount + "key"}
        numColumns={columnItemsCount}
        disableVirtualization={true}
        style={{
          marginTop: item.type !== "note" ? 10 : 0,
          paddingTop: 10,
          marginLeft: 6
        }}
        contentContainerStyle={{
          alignSelf: "center",
          width: buttons.length < 5 ? "100%" : null,
          paddingLeft: buttons.length < 5 ? 10 : 0
        }}
        renderItem={_renderRowItem}
      />
    </>
  ) : (
    <View data={data}>{data.map(renderColumnItem)}</View>
  );
};
