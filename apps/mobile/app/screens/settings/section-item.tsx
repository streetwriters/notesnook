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
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
//@ts-ignore
import ToggleSwitch from "toggle-switch-react-native";
import { IconButton } from "../../components/ui/icon-button";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import Seperator from "../../components/ui/seperator";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { SettingStore, useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";
import { components } from "./components";
import { RouteParams, SettingSection } from "./types";
import Heading from "../../components/ui/typography/heading";
import { DefaultAppStyles } from "../../utils/styles";

const _SectionItem = ({ item }: { item: SettingSection }) => {
  const { colors } = useThemeColors();
  const [settings, itemProperty] = useSettingStore((state) => [
    state.settings,
    item.property ? state.settings[item.property] : null
  ]);
  const navigation = useNavigation<NavigationProp<RouteParams>>();
  const current = item.useHook && item.useHook(item);
  const [isHidden, setIsHidden] = useState(
    item.hidden && item.hidden(item.property || current)
  );
  const [isDisabled, setIsDisabled] = useState(
    item.disabled && item.disabled(item.property || current)
  );
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
    setImmediate(() => {
      item.onChange?.(nextValue);
      item.hidden &&
        setIsHidden(item.hidden && item.hidden(item.property || current));
      item.disabled &&
        setIsDisabled(item.disabled && item.disabled(item.property || current));
    });
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

  useEffect(() => {
    setIsHidden(item.hidden && item.hidden(item.property || current));
    setIsDisabled(item.disabled && item.disabled(item.property || current));
  }, [current, item, itemProperty]);

  return isHidden ? null : (
    <Pressable
      disabled={item.type === "component" || isDisabled}
      style={{
        width: "100%",
        alignItems: "center",
        padding: DefaultAppStyles.GAP,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: DefaultAppStyles.GAP,
        opacity: isDisabled ? 0.5 : 1,
        borderRadius: 0,
        ...styles
      }}
      onPress={async () => {
        if (isDisabled) return;
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
          <Heading
            color={
              item.type === "danger"
                ? colors.error.paragraph
                : colors.primary.heading
            }
            size={AppFontSize.sm}
          >
            {typeof item.name === "function" ? item.name(current) : item.name}
          </Heading>

          {!!item.description && (
            <Paragraph
              color={
                item.type === "danger"
                  ? colors.error.paragraph
                  : colors.primary.paragraph
              }
              size={AppFontSize.sm}
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
              editable={!isDisabled}
              onChangeText={(text) => {
                SettingsService.set({
                  [item.property as string]: text
                });
                item.inputProperties?.onSubmitEditing?.(text as any);
              }}
              containerStyle={{ marginTop: DefaultAppStyles.GAP_VERTICAL }}
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
                marginTop: DefaultAppStyles.GAP_VERTICAL
              }}
            >
              <IconButton
                name="minus"
                color={colors.primary.icon}
                onPress={() => {
                  if (isDisabled) return;
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
                size={AppFontSize.xl}
              />
              <Input
                {...item.inputProperties}
                onSubmit={(e) => {
                  onChangeInputSelectorValue(e.nativeEvent.text);
                  item.inputProperties?.onSubmitEditing?.(e);
                }}
                editable={!isDisabled}
                onChangeText={(text) => {
                  onChangeInputSelectorValue(text);
                  item.inputProperties?.onSubmitEditing?.(text as any);
                }}
                keyboardType="decimal-pad"
                containerStyle={{
                  width: 60
                }}
                inputStyle={{
                  width: 60,
                  textAlign: "center"
                }}
                wrapperStyle={{
                  maxWidth: 60,
                  flexGrow: 0,
                  marginBottom: 0,
                  marginHorizontal: DefaultAppStyles.GAP_SMALL
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
                  if (isDisabled) return;
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
                size={AppFontSize.xl}
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
          offColor={colors.primary.icon}
          size="small"
          animationSpeed={150}
          onToggle={onChangeSettings}
        />
      )}

      {loading ? (
        <ActivityIndicator
          size={AppFontSize.xxl}
          color={colors.primary.accent}
        />
      ) : null}
    </Pressable>
  );
};
export const SectionItem = React.memo(_SectionItem, () => true);
