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
import { strings } from "@notesnook/intl";
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
import FormInput, {
  createFormRef,
  FormRef
} from "../../components/ui/input/form-input";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import SettingsService from "../../services/settings";
import useNavigationStore from "../../stores/use-navigation-store";
import { SettingStore, useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";
import { components } from "./components/components";
import { RouteParams, SettingSection } from "./types";

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
  const fieldName = (item.property as string) || item.id;
  const formRef = useRef<FormRef>(
    createFormRef({
      [fieldName]: item.property
        ? `${
            SettingsService.get()[
              item.property as keyof SettingStore["settings"]
            ] ??
            item.inputProperties?.defaultValue ??
            ""
          }`
        : `${item.inputProperties?.defaultValue ?? ""}`
    })
  );

  const [selectorError, setSelectorError] = useState<string>();
  const [selectorValue, setSelectorValue] = useState(() =>
    item.property
      ? `${
          SettingsService.get()[
            item.property as keyof SettingStore["settings"]
          ] ?? ""
        }`
      : ""
  );

  const step = item.step || 1;
  const stepDecimals = `${step}`.split(".")[1]?.length || 0;
  const roundToStep = (value: number) => Number(value.toFixed(stepDecimals));

  const commitInputValue = (text: string) => {
    if (!item.property) return;
    const error = formRef.current?.validateField(fieldName);
    if (error) return;
    SettingsService.set({
      [item.property as string]: text
    });
  };

  const validateSelectorValue = (text: string): string | undefined => {
    for (const validator of item.validators || []) {
      const error = validator(text, {});
      if (error) return error;
    }
    const min = item.minInputValue ?? 0;
    const max = item.maxInputValue ?? Number.MAX_SAFE_INTEGER;
    const num = Number(text);

    if (!text?.trim() || Number.isNaN(num) || num < min || num > max) {
      return strings.valueMustBeBetween(min, max);
    }
    return undefined;
  };

  const onChangeSelectorValue = (text: string) => {
    setSelectorValue(text);
    const error = validateSelectorValue(text);
    setSelectorError(error);
    if (error || !text.trim() || !item.property) return;
    SettingsService.set({
      [item.property as string]: text
    });
  };

  const stepInputValue = (direction: 1 | -1) => {
    if (!checkIsFeatureAvailable()) return;
    if (isDisabled || !item.property) return;
    const min = item.minInputValue ?? 0;
    const max = item.maxInputValue ?? Number.MAX_SAFE_INTEGER;
    const raw = `${
      SettingsService.get()[item.property as keyof SettingStore["settings"]] ??
      ""
    }`;
    const parsed = parseFloat(raw);
    const base = Number.isNaN(parsed) ? (direction === 1 ? min : max) : parsed;
    let next = roundToStep(base + direction * step);
    if (next < min) next = min;
    if (next > max) next = max;
    if (next === base) return;
    setSelectorError(undefined);
    setSelectorValue(`${next}`);
    SettingsService.set({
      [item.property as string]: `${next}`
    });
  };

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

          {item.type === "screen" || item.isModal ? (
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
            <FormInput
              {...item.inputProperties}
              name={fieldName}
              formRef={formRef}
              validators={item.validators || []}
              label={item.inputLabel}
              editable={!isDisabled}
              fwdRef={inputRef}
              fontSize={AppFontSize.sm}
              marginBottom={0}
              containerStyle={{
                marginTop: Spacing.LEVEL_2,
                backgroundColor: colors.secondary.background,
                borderRadius: Radius.XS
              }}
              inputStyle={{
                color: colors.primary.heading
              }}
              onChangeText={(text) => {
                commitInputValue(text);
              }}
              onSubmitEditing={(e) => {
                commitInputValue(e.nativeEvent.text);
                item.inputProperties?.onSubmitEditing?.(e);
              }}
            />
          )}

          {item.type === "input-selector" && (
            <View
              style={{
                marginTop: Spacing.LEVEL_2,
                gap: Spacing.LEVEL_1,
                alignSelf: "flex-start"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.secondary.background,
                  padding: Spacing.LEVEL_2,
                  gap: Spacing.LEVEL_1,
                  borderRadius: Radius.S,
                  borderWidth: 1,
                  borderColor: selectorError
                    ? colors.error.border
                    : "transparent"
                }}
              >
                <IconButton
                  name="minus"
                  iconFamily="notesnook"
                  color={colors.primary.icon}
                  onPress={() => stepInputValue(-1)}
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
                      onChangeSelectorValue(e.nativeEvent.text);
                      item.inputProperties?.onSubmitEditing?.(e);
                    }}
                    editable={!isDisabled}
                    value={selectorValue}
                    onChangeText={onChangeSelectorValue}
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
                            {item.inputBadgeValue}
                          </Paragraph>
                        ) : null}
                      </>
                    }
                  />
                </View>

                <IconButton
                  name="plus"
                  color={colors.primary.icon}
                  iconFamily="notesnook"
                  onPress={() => stepInputValue(1)}
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

              {selectorError ? (
                <Paragraph
                  size={AppFontSize.xs}
                  style={{ color: colors.error.icon }}
                >
                  <AppIcon
                    color={colors.error.accent}
                    name="alert-circle-outline"
                    size={AppFontSize.sm - 1}
                  />{" "}
                  {selectorError}
                </Paragraph>
              ) : null}
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
