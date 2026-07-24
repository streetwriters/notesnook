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

import { KeyboardTypeOptions, TextInput, TextInputProps } from "react-native";
import { eSendEvent } from "../../services/event-manager";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/events";
import { ButtonProps } from "../ui/button";
import { FieldValidator, FormRef } from "../ui/input/form-input";
import { RefObject } from "react";
import { IconProps } from "../ui/AppIcon";
import { PressableProps } from "../ui/pressable";

export type DialogInfo = {
  title?: string;
  paragraph?: string;
  centered?: boolean;
  positiveText: string;
  negativeText: string;
  background?: string;
  transparent?: boolean;
  statusBarTranslucent?: boolean;
  positivePress?: (...args: any[]) => Promise<any>;
  onClose?: () => void;
  positiveType?: PressableProps["type"];
  icon?: string;
  iconFamily?: IconProps["iconFamily"];
  iconType?: "error" | "normal";
  paragraphColor: string;
  form?: {
    formRef: FormRef;
    items: {
      name: string;
      placeholder: string;
      label?: string;
      validators: FieldValidator[];
      defaultValue?: string;
      ref: RefObject<TextInput | null>;
      inputProps?: TextInputProps;
    }[];
    onFormSubmit?: (form: FormRef, checked?: boolean) => Promise<boolean>;
  };
  input: boolean;
  inputLabel?: string;
  inputPlaceholder: string;
  defaultValue: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  context: "global" | "local" | (string & {});
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  check?: {
    info: string;
    type?: ButtonProps["type"];
    defaultValue?: boolean;
  };
  notice: {
    text: string;
    type: "alert" | "information";
  };
  disableBackdropClosing: boolean;
  component: JSX.Element | ((close?: () => void) => JSX.Element);
};

export function presentDialog(data: Partial<DialogInfo>): void {
  eSendEvent(eOpenSimpleDialog, data);
}

export function hideDialog(): void {
  eSendEvent(eCloseSimpleDialog);
}
