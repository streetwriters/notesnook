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
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ToggleSwitch from "toggle-switch-react-native";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { SIZE, normalize } from "../../utils/size";
import { Button } from "../ui/button";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

function _MenuItem({
  item,
  index,
  testID,
  rightBtn
}: {
  item: any;
  index: number;
  testID: string;
  rightBtn?: {
    name: string;
    icon: string;
    func: () => void;
  };
}) {
  const { colors } = useThemeColors();
  const isFocused = useNavigationStore(
    (state) => state.focusedRouteId === item.name
  );
  const primaryColors = isFocused ? colors.selected : colors.primary;

  const _onPress = () => {
    if (item.func) {
      item.func();
    } else {
      if (useNavigationStore.getState().currentRoute !== item.name) {
        Navigation.navigate(item.name, {
          canGoBack: false,
          beta: item.isBeta
        });
      }
    }
    if (item.close) {
      setImmediate(() => {
        Navigation.closeDrawer();
      });
    }
  };

  return (
    <Pressable
      testID={testID}
      key={item.name + index}
      onPress={_onPress}
      type={isFocused ? "selected" : "plain"}
      style={{
        width: "100%",
        alignSelf: "center",
        borderRadius: 5,
        flexDirection: "row",
        paddingHorizontal: 8,
        justifyContent: "space-between",
        alignItems: "center",
        height: normalize(50),
        marginBottom: 5
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <Icon
          style={{
            width: 30,
            textAlignVertical: "center",
            textAlign: "left"
          }}
          allowFontScaling
          name={item.icon}
          color={
            item.icon === "crown"
              ? colors.static.yellow
              : isFocused
              ? colors.selected.icon
              : colors.secondary.icon
          }
          size={SIZE.lg - 2}
        />
        {isFocused ? (
          <Heading color={colors.selected.heading} size={SIZE.md}>
            {item.title || item.name}
          </Heading>
        ) : (
          <Paragraph size={SIZE.md}>{item.title || item.name}</Paragraph>
        )}

        {item.isBeta ? (
          <View
            style={{
              borderRadius: 100,
              backgroundColor: primaryColors.accent,
              paddingHorizontal: 4,
              marginLeft: 5,
              paddingVertical: 2
            }}
          >
            <Paragraph color={primaryColors.accentForeground} size={SIZE.xxs}>
              {strings.beta()}
            </Paragraph>
          </View>
        ) : null}
      </View>

      {item.switch ? (
        <ToggleSwitch
          isOn={item.on}
          onColor={primaryColors.accent}
          offColor={primaryColors.icon}
          size="small"
          animationSpeed={150}
          onToggle={_onPress}
        />
      ) : rightBtn ? (
        <Button
          title={rightBtn.name}
          type="shade"
          height={30}
          fontSize={SIZE.xs}
          iconSize={SIZE.xs}
          icon={rightBtn.icon}
          style={{
            borderRadius: 100,
            paddingHorizontal: 16
          }}
          onPress={rightBtn.func}
        />
      ) : null}
    </Pressable>
  );
}

export const MenuItem = React.memo(_MenuItem, (prev, next) => {
  if (prev.item.name !== next.item.name) return false;
  if (prev.rightBtn?.name !== next.rightBtn?.name) return false;
  return true;
});
