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
import phone from "phone";
import React, { RefObject, useRef, useState } from "react";
import {
  ColorValue,
  findNodeHandle,
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSubmitEditingEventData,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import isURL from "validator/lib/isURL";
import { Spacing } from "../../../common/design/spacing";
import {
  validateEmail,
  validatePass,
  validateUsername
} from "../../../services/validation";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import { IconButton } from "../icon-button";
import Paragraph from "../typography/paragraph";
import { useInputError } from "./input-error-context";

interface InputProps extends TextInputProps {
  fwdRef?: RefObject<TextInput | null>;
  validationType?:
    | "password"
    | "email"
    | "confirmPassword"
    | "username"
    | "phonenumber"
    | "url";
  loading?: boolean;
  onSubmit?: (
    event: NativeSyntheticEvent<TextInputSubmitEditingEventData>
  ) => void | undefined;
  onErrorCheck?: (error: boolean) => void;
  errorMessage?: string;
  customColor?: ColorValue;
  customValidator?: () => string;
  marginBottom?: number;
  button?: {
    icon: string;
    color: ColorValue;
    onPress: () => void;
    testID?: string;
    size?: number;
  };
  buttons?: React.ReactNode;
  onBlurInput?: () => void;
  height?: number;
  fontSize?: number;
  onFocusInput?: () => void;
  marginRight?: number;
  buttonLeft?: React.ReactNode;
  inputStyle?: TextInputProps["style"];
  containerStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  flexGrow?: number;
  label?: string;
}

const Input = ({
  fwdRef,
  validationType,
  loading,
  onChangeText,
  onSubmit,
  onErrorCheck,
  errorMessage,
  secureTextEntry,
  customColor,
  customValidator,
  marginBottom = 0,
  button,
  onBlurInput,
  onPress,
  height = 45,
  fontSize = AppFontSize.sm,
  onFocusInput,
  buttons,
  marginRight,
  buttonLeft,
  label,
  flexGrow = 1,
  inputStyle = {},
  containerStyle = {},
  wrapperStyle = {},
  ...restProps
}: InputProps) => {
  const { colors, isDark } = useThemeColors();
  const errorCtx = useInputError();
  const internalRef = useRef<TextInput>(null);
  const activeRef = fwdRef ?? internalRef;
  const [error, setError] = useState(false);
  const [focus, setFocus] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorList, setErrorList] = useState({
    SHORT_PASS: false
  });
  type ErrorKey = keyof typeof errorList;

  const reportError = (message: string | null) => {
    if (!errorCtx) return;
    const nativeId = findNodeHandle(activeRef.current);
    if (nativeId !== null) errorCtx.setError(nativeId, message);
  };
  const color = error
    ? colors.error.border
    : focus
      ? customColor || colors.selected.border
      : colors.primary.border;

  const validate = async (value: string) => {
    if (!validationType) return;
    if (!value || value?.length === 0) {
      setError(false);
      onErrorCheck && onErrorCheck(false);
      setErrorList({
        SHORT_PASS: true
      });
      return;
    }
    let isValid: boolean | string | undefined = undefined;

    switch (validationType) {
      case "password":
        isValid = validatePass(value);
        break;
      case "email":
        isValid = validateEmail(value);
        break;
      case "username":
        isValid = validateUsername(value);
        break;
      case "confirmPassword":
        isValid = customValidator && value === customValidator();
        break;
      case "url":
        isValid = isURL(value, { allow_underscores: true });
        break;
      case "phonenumber": {
        const result = phone(value, {
          strictDetection: true,
          validateMobilePrefix: true
        });
        isValid = result.isValid;
        if (result.isValid) {
          onChangeText && onChangeText(result.phoneNumber);
        }

        break;
      }
    }

    const hasError = !isValid;
    setError(hasError);
    onErrorCheck && onErrorCheck(hasError);
    reportError(hasError ? (errorMessage ?? null) : null);
  };

  const onChange = (value: string) => {
    onChangeText && onChangeText(value);
    setShowError(false);
    validate(value);
    if (value === "") {
      setError(false);
      setErrorList({
        SHORT_PASS: false
      });
      reportError(null);
    }
  };

  const onBlur = () => {
    setFocus(false);
    if (onBlurInput) {
      onBlurInput();
    }
  };

  const onFocus = () => {
    setFocus(true);
    if (onFocusInput) {
      onFocusInput();
    }
  };

  const style: ViewStyle = {
    borderWidth: 1,
    borderRadius: defaultBorderRadius,
    borderColor: error ? colors.static.red : color,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.LEVEL_2,
    paddingRight:
      buttons || button || secureTextEntry || error
        ? Spacing.LEVEL_3
        : Spacing.LEVEL_3,
    ...containerStyle
  };

  const textStyle: TextInputProps["style"] = {
    paddingHorizontal: 0,
    fontSize: fontSize,
    color:
      onPress && loading ? colors.primary.accent : colors.primary.paragraph,
    paddingTop: Spacing.LEVEL_3,
    paddingBottom: Spacing.LEVEL_3,
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: "Inter-Regular",
    ...(inputStyle as ViewStyle)
  };

  return (
    <>
      <View
        importantForAccessibility="yes"
        style={{
          marginBottom: marginBottom,
          marginRight: marginRight,
          ...wrapperStyle
        }}
      >
        {label ? (
          <Paragraph
            style={{
              marginBottom: Spacing.LEVEL_1
            }}
            color={colors.primary.paragraph}
            fontSize="XS"
          >
            {label}
          </Paragraph>
        ) : undefined}
        <TouchableOpacity
          disabled={!loading}
          onPress={onPress}
          activeOpacity={1}
          style={style}
        >
          {buttonLeft && buttonLeft}

          <TextInput
            {...restProps}
            ref={activeRef}
            onLayout={restProps.onLayout}
            editable={!loading && restProps.editable}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={
              validationType === "email"
                ? "email-address"
                : restProps.keyboardType
            }
            importantForAutofill="yes"
            importantForAccessibility="yes"
            keyboardAppearance={isDark ? "dark" : "light"}
            onFocus={onFocus}
            onSubmitEditing={onSubmit}
            style={textStyle}
            secureTextEntry={secureTextEntry && secureEntry}
            placeholderTextColor={colors.primary.placeholder}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              height: 35 > height ? height : 35,
              alignItems: "center"
            }}
          >
            {secureTextEntry && (
              <IconButton
                name="eye"
                size={20}
                top={10}
                bottom={10}
                onPress={() => {
                  fwdRef?.current?.blur();
                  setSecureEntry(!secureEntry);
                }}
                style={{
                  width: 25,
                  marginLeft: 5
                }}
                color={
                  secureEntry ? colors.secondary.icon : colors.primary.accent
                }
              />
            )}

            {buttons}

            {button && (
              <IconButton
                testID={button.testID}
                name={button.icon}
                size={AppFontSize.xl}
                top={10}
                bottom={10}
                onPress={button.onPress}
                color={button.color}
                style={{
                  marginRight: -8
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default Input;
