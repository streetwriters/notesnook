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

import { FeatureResult, useIsFeatureAvailable } from "@notesnook/common";
import { useThemeColors } from "@notesnook/theme";
import {
  NavigationProp,
  StackActions,
  useNavigation
} from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { FontFamily } from "../../common/design/font";
import { Radius, Spacing } from "../../common/design/spacing";
import PaywallSheet from "../../components/sheets/paywall";
import AppIcon from "../../components/ui/AppIcon";
import { IconButton } from "../../components/ui/icon-button";
import Input from "../../components/ui/input";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { SettingStore, useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";
import { components } from "./components/components";
import { RouteParams, SettingSection } from "./types";
import { planToDisplayNameShort } from "../../utils/constants";

const _SectionItem = ({ item }: { item: SettingSection }) => {
  const { colors } = useThemeColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isFeatureAvailable = item.featureId
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useIsFeatureAvailable(item.featureId)
    : ({
        isAllowed: true
      } as FeatureResult);
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
  const [inputSelectorValue, setInputSelectorValue] = useState(() =>
    item.property
      ? `${
          SettingsService.get()[
            item.property as keyof SettingStore["settings"]
          ] ?? ""
        }`
      : ""
  );

  const onChangeSettings = async () => {
    if (isDisabled) return;
    if (!checkIsFeatureAvailable()) return;
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

  const updateInput = (value: any) => {
    setInputSelectorValue(`${value}`);
  };

  const onChangeInputSelectorValue = (text: any, commit?: boolean) => {
    // While typing (commit === false) an empty field is allowed so the user can
    // clear and retype; on commit (submit/blur) an empty field falls back to min.
    if (!text && !commit) {
      setInputSelectorValue("");
      return;
    }

    const min = item.minInputValue || 0;
    const max = item.maxInputValue || 0;
    const value = parseInt(text);

    // Always cap the upper bound. Only enforce the lower bound on commit so that
    // partial entries (e.g. typing "5" on the way to "50" when min is 8) aren't
    // snapped up prematurely.
    let clamped: number;
    if (Number.isNaN(value)) clamped = min;
    else if (value > max) clamped = max;
    else if (commit && value < min) clamped = min;
    else clamped = value;

    // The input is controlled via `value`, so the clamped result is reflected in
    // the field directly and can never display a value outside the range.
    setInputSelectorValue(`${clamped}`);
    SettingsService.set({
      [item.property as string]: `${clamped}`
    });
  };

  useEffect(() => {
    setIsHidden(item.hidden && item.hidden(item.property || current));
    setIsDisabled(
      !isFeatureAvailable?.isAllowed ||
        (item.disabled && item.disabled(item.property || current))
    );
  }, [current, item, itemProperty, isFeatureAvailable?.isAllowed]);

  const checkIsFeatureAvailable = React.useCallback(() => {
    if (!isFeatureAvailable) return false;
    if (isFeatureAvailable && !isFeatureAvailable?.isAllowed) {
      PaywallSheet.present(isFeatureAvailable);
      return false;
    }

    return true;
  }, [isFeatureAvailable]);

  const isOn = item.getter
    ? item.getter(item.property || current)
    : settings[item?.property as never];

  return isHidden ? null : (
    <Pressable
      disabled={item.type === "component"}
      style={{
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: Spacing.LEVEL_3,
        paddingVertical: item.component && !item.name ? 0 : Spacing.LEVEL_1,
        borderRadius: 0,
        marginBottom: Spacing.LEVEL_0,
        overflow: "hidden"
      }}
      type="transparent"
      noborder
      onPress={async () => {
        if (!checkIsFeatureAvailable()) return;
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
          flexDirection: "column",
          width: "100%"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_2,
            width: "100%"
          }}
        >
          {item.icon ? (
            <View
              style={{
                width: 32,
                height: 32,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor:
                  item.component === "colorpicker"
                    ? colors.primary.accent
                    : colors.secondary.background,
                borderRadius: Radius.XS
              }}
            >
              <AppIcon
                color={
                  item.type === "danger"
                    ? colors.error.accent
                    : colors.primary.icon
                }
                iconFamily={item.iconFamily}
                name={item.icon}
                size={item.iconSize || 16}
              />
            </View>
          ) : null}

          <View
            style={{
              paddingRight: item.type === "switch" ? Spacing.LEVEL_1 : 0,
              gap: Spacing.LEVEL_1,
              flexShrink: 1,
              flex: 1
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.LEVEL_1,
                alignItems: "center"
              }}
            >
              {item.name ? (
                <Heading
                  color={colors.primary.heading}
                  fontSize="MD"
                  lineHeight="100%"
                >
                  {typeof item.name === "function"
                    ? item.name(current)
                    : item.name}
                </Heading>
              ) : null}

              {!isFeatureAvailable?.isAllowed ? (
                <View
                  style={{
                    paddingVertical: Spacing.LEVEL_0,
                    paddingHorizontal: Spacing.LEVEL_1,
                    borderRadius: 100,
                    backgroundColor: colors.primary.accent,
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "row",
                    gap: Spacing.LEVEL_0
                  }}
                >
                  <AppIcon
                    color={colors.static.orange}
                    size={10}
                    name="crown-simple"
                    iconFamily="notesnook"
                  />
                  {isFeatureAvailable?.availableOn ? (
                    <Paragraph
                      style={{ color: colors.primary.accentForeground }}
                      fontSize="XXS"
                      fontFamily="MEDIUM"
                    >
                      Pro
                    </Paragraph>
                  ) : null}
                </View>
              ) : null}
            </View>

            {item.description ? (
              <Paragraph
                color={colors.primary.paragraph}
                fontSize="SM"
                lineHeight="110%"
              >
                {typeof item.description === "function"
                  ? item.description(current)
                  : item.description}
              </Paragraph>
            ) : null}
          </View>

          {loading || item.type === "switch" ? (
            <View
              style={{
                width: 26,
                height: 26,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {item.type === "switch" && !loading && (
                <AppIcon
                  name={isOn ? "toggle-on" : "toggle-off"}
                  iconFamily="notesnook"
                  size={16}
                  color={
                    isOn
                      ? [colors.primary.accent, colors.primary.accentForeground]
                      : [colors.disabled.icon, colors.primary.background]
                  }
                />
              )}
              {loading ? (
                <ActivityIndicator size={16} color={colors.primary.accent} />
              ) : null}
            </View>
          ) : null}

          {item.type === "screen" ? (
            <AppIcon
              name="chevron-right"
              iconFamily="notesnook"
              size={16}
              color={colors.primary.icon}
            />
          ) : null}
        </View>

        <View
          style={{
            gap: Spacing.LEVEL_1,
            paddingLeft: item.name ? Spacing.LEVEL_2 + 32 : undefined
          }}
        >
          {!!item.component && item.type !== "screen" && (
            <View
              style={{
                width: "100%",
                paddingTop: item.icon ? Spacing.LEVEL_2 : 0
              }}
            >
              {components[item.component]}
            </View>
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
              containerStyle={{
                marginTop: Spacing.LEVEL_2,
                backgroundColor: colors.secondary.background,
                borderWidth: 0
              }}
              inputStyle={{
                color: colors.primary.heading
              }}
              fontSize={AppFontSize.sm}
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
                marginTop: Spacing.LEVEL_2,
                backgroundColor: colors.secondary.background,
                alignSelf: "flex-start",
                padding: Spacing.LEVEL_2,
                gap: Spacing.LEVEL_1,
                borderRadius: Radius.S
              }}
            >
              <IconButton
                name="plus"
                color={colors.primary.icon}
                iconFamily="notesnook"
                onPress={() => {
                  if (!checkIsFeatureAvailable()) return;
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
                size={16}
                type="tertiary"
                style={{
                  borderRadius: Radius.XXS,
                  padding: Spacing.LEVEL_0,
                  width: undefined,
                  height: undefined
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 1
                }}
              >
                <Input
                  {...item.inputProperties}
                  onSubmit={(e) => {
                    onChangeInputSelectorValue(e.nativeEvent.text, true);
                    item.inputProperties?.onSubmitEditing?.(e);
                  }}
                  editable={!isDisabled}
                  value={inputSelectorValue}
                  onChangeText={(text) => {
                    onChangeInputSelectorValue(text);
                    item.inputProperties?.onSubmitEditing?.(text as any);
                  }}
                  keyboardType="decimal-pad"
                  containerStyle={{
                    borderWidth: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                    height: 25,
                    borderRadius: 0,
                    minWidth: 25
                  }}
                  fontSize={AppFontSize.sm}
                  inputStyle={{
                    textAlign: "center",
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                    fontFamily: FontFamily.SEMI_BOLD,
                    color: colors.primary.heading
                  }}
                  wrapperStyle={{
                    flexGrow: 0,
                    marginBottom: 0,
                    paddingLeft: 0,
                    paddingRight: 0
                  }}
                  buttons={
                    <>
                      {item.inputBadgeValue ? (
                        <Paragraph
                          fontSize="XXS"
                          style={{
                            marginLeft: 1,
                            marginTop: 2,
                            color: colors.primary.heading
                          }}
                          color={colors.primary.paragraph}
                        >
                          px
                        </Paragraph>
                      ) : null}
                    </>
                  }
                />
              </View>

              <IconButton
                name="minus"
                iconFamily="notesnook"
                color={colors.primary.icon}
                onPress={() => {
                  if (!checkIsFeatureAvailable()) return;
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
                size={16}
                type="tertiary"
                style={{
                  borderRadius: Radius.XXS,
                  padding: Spacing.LEVEL_0,
                  width: undefined,
                  height: undefined
                }}
              />
            </View>
          )}
        </View>
      </View>

      {/* {item.type === "switch" && !loading && (
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
      )} */}
    </Pressable>
  );
};
export const SectionItem = React.memo(_SectionItem, () => true);
