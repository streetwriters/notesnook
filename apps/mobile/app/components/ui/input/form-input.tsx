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

import React, { RefObject, useEffect, useMemo, useState } from "react";
import {
  ColorValue,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from "react-native";
import isEmail from "validator/lib/isEmail";
import isURL from "validator/lib/isURL";
import { useThemeColors } from "@notesnook/theme";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { IconButton } from "../icon-button";
import Paragraph from "../typography/paragraph";
import AppIcon from "../AppIcon";

export type FormValues = Record<string, string>;
export type FormErrors = Partial<Record<string, string>>;
export type FieldValidator = (
  value: string,
  values: FormValues
) => string | undefined;
export type ValidationSchema = Partial<Record<string, FieldValidator[]>>;

export interface FormRef {
  values: FormValues;
  errors: FormErrors;
  setValue: (name: string, value: string) => void;
  getValue: (name: string) => string;
  getValues: () => FormValues;
  setError: (name: string, error?: string) => void;
  getError: (name: string) => string | undefined;
  clearErrors: () => void;
  registerField: (name: string, validators?: FieldValidator[]) => void;
  unregisterField: (name: string) => void;
  validateField: (name: string) => string | undefined;
  validate: () => boolean;
  subscribe: (listener: () => void) => () => void;
}

export function createFormRef(initialValues: FormValues = {}): FormRef {
  const listeners = new Set<() => void>();
  const values: FormValues = { ...initialValues };
  const errors: FormErrors = {};
  const schema: ValidationSchema = {};

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    values,
    errors,
    setValue(name, value) {
      values[name] = value;
      if (errors[name]) {
        delete errors[name];
        notify();
      }
    },
    getValue(name) {
      return values[name] ?? "";
    },
    getValues() {
      return { ...values };
    },
    setError(name, error) {
      if (!error) {
        delete errors[name];
      } else {
        errors[name] = error;
      }
      notify();
    },
    getError(name) {
      return errors[name];
    },
    clearErrors() {
      Object.keys(errors).forEach((key) => delete errors[key]);
      notify();
    },
    registerField(name, validators = []) {
      schema[name] = validators;
      if (values[name] === undefined) values[name] = "";
    },
    unregisterField(name) {
      delete schema[name];
      delete errors[name];
      notify();
    },
    validateField(name) {
      const fieldValidators = schema[name] || [];
      const value = values[name] ?? "";
      for (const validator of fieldValidators) {
        const error = validator(value, values);
        if (error) {
          errors[name] = error;
          notify();
          return error;
        }
      }
      delete errors[name];
      notify();
      return undefined;
    },
    validate() {
      const nextErrors = validateForm(values, schema);
      Object.keys(errors).forEach((key) => delete errors[key]);
      Object.keys(nextErrors).forEach((key) => {
        errors[key] = nextErrors[key];
      });
      notify();
      return !hasFormErrors(nextErrors);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export function validateForm(
  values: FormValues,
  schema: ValidationSchema
): FormErrors {
  const errors: FormErrors = {};

  Object.keys(schema).forEach((field) => {
    const fieldValidators = schema[field] || [];
    const value = values[field] ?? "";
    for (const validator of fieldValidators) {
      const error = validator(value, values);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return errors;
}

export function hasFormErrors(errors: FormErrors) {
  return Object.keys(errors).length > 0;
}

export const validators = {
  required:
    (message = "This field is required") =>
    (value: string) =>
      value?.trim() ? undefined : message,

  email:
    (message = "Please enter a valid email") =>
    (value: string) =>
      !value?.trim() || isEmail(value.trim()) ? undefined : message,

  minLength: (length: number, message?: string) => (value: string) =>
    !value || value.length >= length
      ? undefined
      : message || `Must be at least ${length} characters`,

  url:
    (message = "Please enter a valid URL") =>
    (value: string) =>
      !value?.trim() || isURL(value.trim(), { allow_underscores: true })
        ? undefined
        : message,

  matchField:
    (fieldName: string, message = "Values do not match") =>
    (value: string, values: FormValues) =>
      value === values[fieldName] ? undefined : message
};

interface FormInputProps extends TextInputProps {
  name: string;
  formRef: RefObject<FormRef>;
  validators?: FieldValidator[];
  fwdRef?: RefObject<TextInput | null>;
  loading?: boolean;
  error?: string;
  customColor?: ColorValue;
  marginBottom?: number;
  marginRight?: number;
  button?: {
    icon: string;
    color: ColorValue;
    onPress: () => void;
    testID?: string;
    size?: number;
  };
  buttons?: React.ReactNode;
  buttonLeft?: React.ReactNode;
  height?: number;
  fontSize?: number;
  inputStyle?: TextInputProps["style"];
  containerStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  errorStyle?: TextStyle;
}

export function FormInput({
  name,
  formRef,
  validators: fieldValidators = [],
  fwdRef,
  loading,
  error,
  secureTextEntry,
  customColor,
  marginBottom = 10,
  marginRight,
  button,
  buttonLeft,
  buttons,
  height = 45,
  fontSize = AppFontSize.sm,
  inputStyle = {},
  containerStyle = {},
  wrapperStyle = {},
  onFocus,
  onBlur,
  onPress,
  onChangeText,
  errorStyle,
  ...restProps
}: FormInputProps) {
  const { colors, isDark } = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);
  const [, setVersion] = useState(0);

  useEffect(() => {
    const form = formRef.current;
    form.registerField(name, fieldValidators);
    const unsubscribe = form.subscribe(() => {
      setVersion((v) => v + 1);
    });

    return () => {
      unsubscribe();
      form.unregisterField(name);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formRef, name]);

  const value = formRef.current.getValue(name);
  const fieldError = error || formRef.current.getError(name);

  const borderColor = useMemo(() => {
    if (fieldError) return colors.error.accent;
    if (focused) return customColor || colors.selected.border;
    return colors.primary.border;
  }, [colors, customColor, fieldError, focused]);

  const style: ViewStyle = {
    borderWidth: 1,
    borderRadius: defaultBorderRadius,
    borderColor,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DefaultAppStyles.GAP,
    ...containerStyle
  };

  const textStyle: TextInputProps["style"] = {
    paddingHorizontal: 0,
    fontSize,
    color:
      onPress && loading ? colors.primary.accent : colors.primary.paragraph,
    flexGrow: 1,
    flexShrink: 1,
    paddingBottom: DefaultAppStyles.GAP_VERTICAL,
    paddingTop: DefaultAppStyles.GAP_VERTICAL,
    fontFamily: "Inter-Regular",
    ...(inputStyle as ViewStyle)
  };

  const handleChangeText = (nextValue: string) => {
    formRef.current.setValue(name, nextValue);
    onChangeText?.(nextValue);
  };

  return (
    <View
      importantForAccessibility="yes"
      style={{
        marginBottom,
        marginRight,
        ...wrapperStyle
      }}
    >
      <TouchableOpacity
        disabled={!loading}
        onPress={onPress}
        activeOpacity={1}
        style={style}
      >
        {buttonLeft}

        <TextInput
          {...restProps}
          defaultValue={value}
          ref={fwdRef}
          editable={!loading && restProps.editable !== false}
          onChangeText={handleChangeText}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          keyboardAppearance={isDark ? "dark" : "light"}
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
              size={button.size || AppFontSize.xl}
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

      {fieldError ? (
        <Paragraph
          size={AppFontSize.xs}
          style={[{ marginTop: 5, color: colors.error.icon }, errorStyle]}
        >
          <AppIcon
            color={colors.error.accent}
            name="alert-circle-outline"
            size={AppFontSize.sm - 1}
          />{" "}
          {fieldError}
        </Paragraph>
      ) : null}
    </View>
  );
}

export default FormInput;
