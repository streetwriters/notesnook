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
import {
  NavigationProp,
  StackActions,
  useNavigation
} from "@react-navigation/native";
import React, { useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import ToggleSwitch from "toggle-switch-react-native";
import { IconButton } from "../../components/ui/icon-button";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import Seperator from "../../components/ui/seperator";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { SettingStore, useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { components } from "./components";
import { RouteParams, SettingSection } from "./types";

const _SectionItem = ({ item }: { item: SettingSection }) => {
  const { colors } = useThemeColors();
  const settings = useSettingStore((state) => state.settings);
  const navigation = useNavigation<NavigationProp<RouteParams>>();
  const current = item.useHook && item.useHook(item);
  const isHidden = item.hidden && item.hidden(item.property || current);
  const inputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);

  const onChangeSettings = async () => {
    if (loading) return;
    if (item.onVerify && !(await item.onVerify())) return;
    if (item.modifer) {
      setLoading(true);
      await item.modifer(item.property || current);
      setLoading(false);
      return;
    }
    if (!item.property) return;
    const nextValue = !settings[item.property];
    SettingsService.set({
      [item.property]: nextValue
    });
    setImmediate(() => item.onChange?.(nextValue));
  };

  const styles =
    item.type === "danger"
      ? {
          backgroundColor: colors.error.background
        }
      : {};

  const updateInput = (value: any) => {
    inputRef?.current?.setNativeProps({
      text: value + ""
    });
  };

  const onChangeInputSelectorValue = (text: any) => {
    if (text) {
      const min = item.minInputValue || 0;
      const max = item.maxInputValue || 0;
      const value = parseInt(text);
      text =
        Number.isNaN(value) || value < min ? min : value > max ? max : text;

      SettingsService.set({
        [item.property as string]: `${text}`
      });
    }
  };

  return isHidden ? null : (
    <Pressable
      disabled={item.type === "component"}
      style={{
        width: "100%",
        alignItems: "center",
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 20,
        borderRadius: 0,
        ...styles
      }}
      onPress={async () => {
        switch (item.type) {
          case "screen":
            {
              if (item.onVerify && !(await item.onVerify())) return;
              navigation.dispatch(StackActions.push("SettingsGroup", item));
              useNavigationStore.getState().update("Settings");
            }
            break;
          case "switch":
            {
              onChangeSettings();
            }
            break;
          default:
            {
              if (item.onVerify && !(await item.onVerify())) return;
              item.modifer && item.modifer(current);
            }
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
              item.component === "colorpicker"
                ? colors.primary.accent
                : undefined,
            borderRadius: 100
          }}
        >
          {!!item.icon && (
            <Icon
              color={
                item.type === "danger"
                  ? colors.error.icon
                  : colors.secondary.icon
              }
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
            color={
              item.type === "danger"
                ? colors.error.paragraph
                : colors.primary.heading
            }
            size={SIZE.md + 1}
          >
            {typeof item.name === "function" ? item.name(current) : item.name}
          </Paragraph>
          {!!item.description && (
            <Paragraph
              color={
                item.type === "danger"
                  ? colors.error.paragraph
                  : colors.primary.paragraph
              }
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
                SettingsService.set({
                  [item.property as string]: e.nativeEvent.text
                });
                item.inputProperties?.onSubmitEditing?.(e);
              }}
              onChangeText={(text) => {
                SettingsService.set({
                  [item.property as string]: text
                });
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
                color={colors.primary.icon}
                onPress={() => {
                  const rawValue = SettingsService.get()[
                    item.property as keyof SettingStore["settings"]
                  ] as string;
                  if (rawValue) {
                    const currentValue = parseInt(rawValue);
                    const minValue = item.minInputValue || 0;
                    if (currentValue <= minValue) return;
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
                  onChangeInputSelectorValue(e.nativeEvent.text);
                  item.inputProperties?.onSubmitEditing?.(e);
                }}
                onChangeText={(text) => {
                  onChangeInputSelectorValue(text);
                  item.inputProperties?.onSubmitEditing?.(text as any);
                }}
                keyboardType="decimal-pad"
                containerStyle={{
                  width: 65
                }}
                wrapperStyle={{
                  maxWidth: 65,
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
                color={colors.primary.icon}
                onPress={() => {
                  const rawValue = SettingsService.get()[
                    item.property as keyof SettingStore["settings"]
                  ] as string;
                  if (rawValue) {
                    const currentValue = parseInt(rawValue);
                    const max = item.maxInputValue || 0;
                    if (currentValue >= max) return;
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

      {item.type === "switch" && !loading && (
        <ToggleSwitch
          isOn={
            item.getter
              ? item.getter(item.property || current)
              : settings[item?.property as never]
          }
          onColor={colors.primary.accent}
          offColor={colors.secondary.icon}
          size="small"
          animationSpeed={150}
          onToggle={onChangeSettings}
        />
      )}

      {loading ? (
        <ActivityIndicator size={SIZE.xxl} color={colors.primary.accent} />
      ) : null}
    </Pressable>
  );
};
export const SectionItem = React.memo(_SectionItem, () => true);
