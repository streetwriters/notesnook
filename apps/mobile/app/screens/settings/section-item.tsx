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
  NavigationProp,
  StackActions,
  useNavigation
} from "@react-navigation/native";
import React, { useRef } from "react";
import { View, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ToggleSwitch from "toggle-switch-react-native";
import Input from "../../components/ui/input";
import { PressableButton } from "../../components/ui/pressable";
import Seperator from "../../components/ui/seperator";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { SettingStore, useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { components } from "./components";
import { RouteParams, SettingSection } from "./types";
import { IconButton } from "../../components/ui/icon-button";

const _SectionItem = ({ item }: { item: SettingSection }) => {
  const colors = useThemeStore((state) => state.colors);
  const settings = useSettingStore((state) => state.settings);
  const navigation = useNavigation<NavigationProp<RouteParams>>();
  const current = item.useHook && item.useHook(item);
  const isHidden = item.hidden && item.hidden(item.property || current);
  const inputRef = useRef<TextInput>(null);

  const onChangeSettings = () => {
    if (item.modifer) {
      item.modifer(item.property || current);
      return;
    }
    if (!item.property) return;
    SettingsService.set({
      [item.property]: !settings[item.property]
    });
    item.onChange?.(!settings[item.property]);
  };

  const styles =
    item.type === "danger"
      ? {
          backgroundColor: colors.errorBg
        }
      : {};

  const updateInput = (value: any) => {
    inputRef?.current?.setNativeProps({
      text: value + ""
    });
  };
  return isHidden ? null : (
    <PressableButton
      disabled={item.type === "component"}
      customStyle={{
        width: "100%",
        alignItems: "center",
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 20,
        borderRadius: 0,
        ...styles
      }}
      onPress={() => {
        switch (item.type) {
          case "screen":
            navigation.dispatch(StackActions.push("SettingsGroup", item));
            useNavigationStore.getState().update(
              {
                name: "SettingsGroup",
                title:
                  typeof item.name === "function"
                    ? item.name(current)
                    : item.name
              },
              true
            );
            break;
          case "switch":
            onChangeSettings();
            break;
          default:
            item.modifer && item.modifer(current);
            break;
        }
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexShrink: 1
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            backgroundColor:
              item.component === "colorpicker" ? colors.accent : undefined,
            borderRadius: 100
          }}
        >
          {!!item.icon && (
            <Icon
              color={item.type === "danger" ? colors.errorText : colors.icon}
              name={item.icon}
              size={30}
            />
          )}
        </View>

        <View
          style={{
            flexShrink: 1,
            paddingRight: item.type === "switch" ? 10 : 0
          }}
        >
          <Paragraph
            color={item.type === "danger" ? colors.errorText : colors.heading}
            size={SIZE.md + 1}
          >
            {typeof item.name === "function" ? item.name(current) : item.name}
          </Paragraph>
          {!!item.description && (
            <Paragraph
              color={item.type === "danger" ? colors.errorText : colors.pri}
              size={SIZE.sm}
            >
              {typeof item.description === "function"
                ? item.description(current)
                : item.description}
            </Paragraph>
          )}

          {!!item.component && item.type !== "screen" && (
            <>
              <Seperator half />
              {components[item.component]}
            </>
          )}

          {item.type === "input" && (
            <Input
              {...item.inputProperties}
              onSubmit={(e) => {
                if (e.nativeEvent.text) {
                  SettingsService.set({
                    [item.property as string]: e.nativeEvent.text
                  });
                }
                item.inputProperties?.onSubmitEditing?.(e);
              }}
              onChangeText={(text) => {
                if (text) {
                  SettingsService.set({
                    [item.property as string]: text
                  });
                }
                item.inputProperties?.onSubmitEditing?.(text as any);
              }}
              containerStyle={{ marginTop: 12 }}
              fwdRef={inputRef}
              onLayout={() => {
                inputRef?.current?.setNativeProps({
                  text:
                    SettingsService.get()[
                      item.property as keyof SettingStore["settings"]
                    ] + ""
                });
              }}
              defaultValue={item.inputProperties?.defaultValue}
            />
          )}

          {item.type === "input-selector" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12
              }}
            >
              <IconButton
                name="minus"
                color={colors.pri}
                onPress={() => {
                  const rawValue = SettingsService.get()[
                    item.property as keyof SettingStore["settings"]
                  ] as string;
                  if (rawValue) {
                    const currentValue = parseInt(rawValue);
                    if (currentValue <= 0) return;
                    const nextValue = currentValue - 1;
                    SettingsService.set({
                      [item.property as string]: nextValue
                    });
                    updateInput(nextValue);
                  }
                }}
                size={SIZE.xl}
              />
              <Input
                {...item.inputProperties}
                onSubmit={(e) => {
                  if (e.nativeEvent.text) {
                    SettingsService.set({
                      [item.property as string]: e.nativeEvent.text
                    });
                  }
                  item.inputProperties?.onSubmitEditing?.(e);
                }}
                onChangeText={(text) => {
                  if (text) {
                    if (item.minInputValue) {
                      text =
                        parseInt(text) < item.minInputValue
                          ? item.minInputValue + ""
                          : text;
                    }
                    SettingsService.set({
                      [item.property as string]: text
                    });
                  }
                  item.inputProperties?.onSubmitEditing?.(text as any);
                }}
                keyboardType="decimal-pad"
                containerStyle={{
                  width: 45
                }}
                wrapperStyle={{
                  maxWidth: 45,
                  marginBottom: 0,
                  marginHorizontal: 6
                }}
                fwdRef={inputRef}
                onLayout={() => {
                  if (item.property) {
                    updateInput(SettingsService.get()[item.property]);
                  }
                }}
                defaultValue={item.inputProperties?.defaultValue}
              />
              <IconButton
                name="plus"
                color={colors.pri}
                onPress={() => {
                  const rawValue = SettingsService.get()[
                    item.property as keyof SettingStore["settings"]
                  ] as string;
                  if (rawValue) {
                    const currentValue = parseInt(rawValue);
                    const nextValue = currentValue + 1;
                    SettingsService.set({
                      [item.property as string]: nextValue
                    });
                    updateInput(nextValue);
                  }
                }}
                size={SIZE.xl}
              />
            </View>
          )}
        </View>
      </View>

      {item.type === "switch" && item.property && (
        <ToggleSwitch
          isOn={
            item.getter
              ? item.getter(item.property || current)
              : settings[item.property]
          }
          onColor={colors.accent}
          offColor={colors.icon}
          size="small"
          animationSpeed={150}
          onToggle={onChangeSettings}
        />
      )}
    </PressableButton>
  );
};
export const SectionItem = React.memo(_SectionItem, () => true);
