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

import React, { RefObject, useState } from "react";
import {
  ColorValue,
  NativeSyntheticEvent,
  TextInput,
  TextInputProps,
  TextInputSubmitEditingEventData,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  ERRORS_LIST,
  validateEmail,
  validatePass,
  validateUsername
} from "../../../services/validation";
import { useThemeColors } from "@notesnook/theme";
import { getElevationStyle } from "../../../utils/elevation";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import { IconButton } from "../icon-button";
import Paragraph from "../typography/paragraph";
import phone from "phone";
import isURL from "validator/lib/isURL";

interface InputProps extends TextInputProps {
  fwdRef?: RefObject<TextInput>;
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
  marginBottom = 10,
  button,
  onBlurInput,
  onPress,
  height = 45,
  fontSize = AppFontSize.md,
  onFocusInput,
  buttons,
  marginRight,
  buttonLeft,
  flexGrow = 1,
  inputStyle = {},
  containerStyle = {},
  wrapperStyle = {},
  ...restProps
}: InputProps) => {
  const { colors, isDark } = useThemeColors();
  const [error, setError] = useState(false);
  const [focus, setFocus] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [showError, setShowError] = useState(false);
  const [errorList, setErrorList] = useState({
    SHORT_PASS: false
  });
  type ErrorKey = keyof typeof errorList;
  const color = error
    ? colors.error.paragraph
    : focus
    ? customColor || colors.primary.accent
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
    let isError:
      | boolean
      | string
      | { SHORT_PASS?: boolean; isValid?: boolean }
      | undefined = undefined;

    switch (validationType) {
      case "password":
        isError = validatePass(value);
        break;
      case "email":
        isError = validateEmail(value);
        break;
      case "username":
        isError = validateUsername(value);
        break;
      case "confirmPassword":
        isError = customValidator && value === customValidator();
        break;
      case "url":
        isError = isURL(value);
        break;
      case "phonenumber": {
        const result = phone(value, {
          strictDetection: true,
          validateMobilePrefix: true
        });
        isError = result.isValid;
        if (result.isValid) {
          onChangeText && onChangeText(result.phoneNumber);
        }

        break;
      }
    }

    if (validationType === "password") {
      let hasError = false;

      const errors = isError as { [name: string]: boolean };
      Object.keys(errors).forEach((e) => {
        //ts-ignore
        if (errors[e] === true) {
          hasError = true;
        }
      });
      setError(hasError);
      onErrorCheck && onErrorCheck(hasError);
      setErrorList(errors as { SHORT_PASS: boolean });
    } else {
      setError(!isError);
      onErrorCheck && onErrorCheck(!isError);
    }
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
    borderColor: color,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexGrow: 1,
    height: height || 50,
    paddingHorizontal: 12,
    paddingRight: buttons || button || secureTextEntry || error ? 6 : 12,
    ...containerStyle
  };

  const textStyle: TextInputProps["style"] = {
    paddingHorizontal: 0,
    fontSize: fontSize,
    color:
      onPress && loading ? colors.primary.accent : colors.primary.paragraph,
    paddingVertical: 0,
    paddingBottom: 2.5,
    flexGrow: 1,
    height: height || 50,
    flexShrink: 1,
    fontFamily: "OpenSans-Regular",
    ...(inputStyle as ViewStyle)
  };

  return (
    <>
      <View
        importantForAccessibility="yes"
        style={{
          height: height,
          marginBottom: marginBottom,
          flexGrow: flexGrow,
          maxHeight: height,
          marginRight: marginRight,
          ...wrapperStyle
        }}
      >
        <TouchableOpacity
          disabled={!loading}
          onPress={onPress}
          activeOpacity={1}
          style={style}
        >
          {buttonLeft && buttonLeft}

          <TextInput
            {...restProps}
            ref={fwdRef}
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
                  secureEntry ? colors.primary.icon : colors.primary.accent
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
              />
            )}

            {error && (
              <IconButton
                name="alert-circle-outline"
                top={10}
                bottom={10}
                onPress={() => {
                  setShowError(!showError);
                }}
                size={20}
                style={{
                  width: 25,
                  marginLeft: 5
                }}
                color={colors.error.icon}
              />
            )}
          </View>

          {error && showError && errorMessage ? (
            <View
              style={{
                position: "absolute",
                backgroundColor: colors.secondary.background,
                paddingVertical: 3,
                paddingHorizontal: 5,
                borderRadius: 2.5,
                ...getElevationStyle(2),
                top: 0
              }}
            >
              <Paragraph
                size={AppFontSize.xs}
                style={{
                  textAlign: "right",
                  textAlignVertical: "bottom"
                }}
              >
                <Icon
                  name="alert-circle-outline"
                  size={AppFontSize.xs}
                  color={colors.error.icon}
                />{" "}
                {errorMessage}
              </Paragraph>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {validationType === "password" && focus && (
        <View
          style={{
            marginTop: -5,
            marginBottom: 5
          }}
        >
          {Object.keys(errorList).filter(
            (k) => errorList[k as ErrorKey] === true
          ).length !== 0
            ? Object.keys(ERRORS_LIST).map((error) => (
                <View
                  key={ERRORS_LIST[error as ErrorKey]}
                  style={{
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <Icon
                    name={errorList[error as ErrorKey] ? "close" : "check"}
                    color={errorList[error as ErrorKey] ? "red" : "green"}
                  />

                  <Paragraph style={{ marginLeft: 5 }} size={AppFontSize.xs}>
                    {ERRORS_LIST[error as ErrorKey]}
                  </Paragraph>
                </View>
              ))
            : null}
        </View>
      )}
    </>
  );
};

export default Input;
