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
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ToggleSwitch from "toggle-switch-react-native";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { SIZE, normalize } from "../../utils/size";
import { Button } from "../ui/button";
import { PressableButton } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const MenuItem = React.memo(
  function MenuItem({ item, index, testID, rightBtn }) {
    const { colors } = useThemeColors();
    const [headerTextState, setHeaderTextState] = useState(
      useNavigationStore.getState().focusedRouteId
    );
    let isFocused = headerTextState?.id === item.name;
    const primaryColors = isFocused ? colors.selected : colors.primary;

    const _onPress = () => {
      if (item.func) {
        item.func();
      } else {
        Navigation.navigate(
          { name: item.name, beta: item.isBeta },
          { canGoBack: false }
        );
      }
      if (item.close) {
        setImmediate(() => {
          Navigation.closeDrawer();
        });
      }
    };

    const onHeaderStateChange = useCallback(
      (state) => {
        setTimeout(() => {
          let id = state.focusedRouteId;
          if (id === item.name) {
            setHeaderTextState({ id: state.focusedRouteId });
          } else {
            if (headerTextState !== null) {
              setHeaderTextState(null);
            }
          }
        }, 300);
      },
      [headerTextState, item.name]
    );

    useEffect(() => {
      let unsub = useNavigationStore.subscribe(onHeaderStateChange);
      return () => {
        unsub();
      };
    }, [headerTextState, onHeaderStateChange]);

    return (
      <PressableButton
        testID={testID}
        key={item.name + index}
        onPress={_onPress}
        type={isFocused ? "selected" : "gray"}
        customStyle={{
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
              {item.name}
            </Heading>
          ) : (
            <Paragraph size={SIZE.md}>{item.name}</Paragraph>
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
                BETA
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
      </PressableButton>
    );
  },
  (prev, next) => {
    if (prev.item.name !== next.item.name) return false;
    if (prev.rightBtn?.name !== next.rightBtn?.name) return false;
    return true;
  }
);
