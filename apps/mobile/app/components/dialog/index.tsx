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
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  RefObject
} from "react";
import { TextInput, View, ViewStyle } from "react-native";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { getContainerBorder } from "../../utils/colors";
import { getElevationStyle } from "../../utils/elevation";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/events";
import { defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { sleep } from "../../utils/time";
import { Toast } from "../toast";
import { Button } from "../ui/button";
import Input from "../ui/input";
import { FormInput, type FormRef } from "../ui/input/form-input";
import { Notice } from "../ui/notice";
import Seperator from "../ui/seperator";
import BaseDialog from "./base-dialog";
import DialogButtons from "./dialog-buttons";
import DialogHeader from "./dialog-header";
import { DialogInfo } from "./functions";

export const Dialog = ({ context = "global" }: { context?: string }) => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState<boolean>();
  const [checked, setChecked] = useState<boolean>();
  const [loading, setLoading] = useState<boolean>();
  const values = useRef<{
    inputValue?: string;
  }>({
    inputValue: undefined
  });
  const inputRef = useRef<TextInput>(null);
  const [dialogInfo, setDialogInfo] = useState<DialogInfo>();
  const formRef = useRef(dialogInfo?.form?.formRef);
  formRef.current = dialogInfo?.form?.formRef;

  const onPressPositive = async () => {
    // Handle form submission if form is available
    if (dialogInfo?.form && formRef.current) {
      inputRef.current?.blur();
      try {
        const isValid = await formRef.current.validate();
        if (!isValid) {
          return;
        }
        if (dialogInfo.form.onFormSubmit) {
          setLoading(true);
          const result = await dialogInfo.form.onFormSubmit(formRef.current);
          if (result === false) {
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        /** Empty */
      }
      setLoading(false);
    } else if (dialogInfo?.positivePress) {
      // Handle old input-based submission
      inputRef.current?.blur();
      setLoading(true);
      let result = false;
      try {
        result = await dialogInfo.positivePress(
          values.current.inputValue,
          checked
        );
      } catch (e) {
        /** Empty */
      }
      setLoading(false);

      if (result === false) {
        return;
      }
    }

    setChecked(false);
    values.current.inputValue = undefined;
    formRef.current = undefined;
    setVisible(false);
  };

  const show = useCallback(
    (data: DialogInfo) => {
      if (!data.context) data.context = "global";
      if (data.context !== context) return;
      setDialogInfo(data);
      setChecked(data.check?.defaultValue);
      formRef.current = data?.form?.formRef;
      values.current.inputValue = data.defaultValue;
      setVisible(true);
    },
    [context]
  );

  const hide = React.useCallback(() => {
    setChecked(false);
    values.current.inputValue = undefined;
    formRef.current = undefined;
    setVisible(false);
    setDialogInfo(undefined);
    dialogInfo?.onClose?.();
  }, [dialogInfo]);

  useEffect(() => {
    eSubscribeEvent(eOpenSimpleDialog, show);
    eSubscribeEvent(eCloseSimpleDialog, hide);

    return () => {
      eUnSubscribeEvent(eOpenSimpleDialog, show);
      eUnSubscribeEvent(eCloseSimpleDialog, hide);
    };
  }, [hide, show]);

  const onNegativePress = async () => {
    if (dialogInfo?.onClose) {
      await dialogInfo.onClose();
    }
    hide();
  };

  const style: ViewStyle = {
    ...getElevationStyle(5),
    width: DDS.isTab ? 400 : "85%",
    maxHeight: 450,
    borderRadius: defaultBorderRadius,
    backgroundColor: colors.primary.background,
    paddingTop: 12,
    ...getContainerBorder(colors.primary.border, 0.5),
    overflow: "hidden"
  };

  return visible && dialogInfo ? (
    <BaseDialog
      statusBarTranslucent={
        dialogInfo.statusBarTranslucent === undefined
          ? false
          : dialogInfo.statusBarTranslucent
      }
      bounce={!dialogInfo.input && !dialogInfo.form}
      closeOnTouch={!dialogInfo.disableBackdropClosing}
      background={dialogInfo.background}
      transparent={
        dialogInfo.transparent === undefined ? false : dialogInfo.transparent
      }
      onShow={async () => {
        if (dialogInfo.input && !dialogInfo.form) {
          inputRef.current?.setNativeProps({
            text: dialogInfo.defaultValue
          });
          await sleep(300);
          inputRef.current?.focus();
        } else if (dialogInfo.form) {
          const items = dialogInfo.form?.items;
          const firstItem = items[0];
          for (const item of items) {
            if (item.defaultValue) {
              item.ref.current?.setNativeProps({
                text: dialogInfo.defaultValue
              });
            }
          }
          firstItem?.ref?.current?.focus();
        }
      }}
      visible={true}
      onRequestClose={hide}
    >
      {typeof dialogInfo.component === "function"
        ? dialogInfo.component(() => hide())
        : dialogInfo.component}

      {dialogInfo.component ? null : (
        <View style={style}>
          <DialogHeader
            title={dialogInfo.title}
            icon={dialogInfo.icon}
            paragraph={dialogInfo.paragraph}
            paragraphColor={dialogInfo.paragraphColor}
            padding={12}
            style={{
              minHeight: 0
            }}
          />
          <Seperator half />

          {dialogInfo.form ? (
            <View
              style={{
                paddingHorizontal: DefaultAppStyles.GAP,
                gap: DefaultAppStyles.GAP / 2
              }}
            >
              {dialogInfo.form.items.map((item, index) => (
                <FormInput
                  key={item.name}
                  fwdRef={item.ref}
                  name={item.name}
                  autoFocus={index === 0}
                  placeholder={item.placeholder}
                  formRef={formRef as RefObject<FormRef>}
                  validators={item.validators}
                  defaultValue={item.defaultValue}
                  secureTextEntry={dialogInfo.secureTextEntry}
                  onSubmitEditing={() => {
                    const nextItem = dialogInfo?.form?.items?.[index + 1];
                    if (nextItem) {
                      nextItem?.ref.current?.focus();
                    } else {
                      onPressPositive();
                    }
                  }}
                />
              ))}
            </View>
          ) : dialogInfo.input ? (
            <View
              style={{
                paddingHorizontal: DefaultAppStyles.GAP
              }}
            >
              <Input
                fwdRef={inputRef}
                autoCapitalize="none"
                onChangeText={(value) => {
                  values.current.inputValue = value;
                }}
                testID="input-value"
                secureTextEntry={dialogInfo.secureTextEntry}
                defaultValue={dialogInfo.defaultValue}
                onSubmit={() => {
                  onPressPositive();
                }}
                returnKeyLabel="Done"
                returnKeyType="done"
                keyboardType={dialogInfo.keyboardType || "default"}
                placeholder={dialogInfo.inputPlaceholder}
              />
            </View>
          ) : null}

          {dialogInfo?.notice ? (
            <View
              style={{
                paddingHorizontal: DefaultAppStyles.GAP
              }}
            >
              <Notice
                type={dialogInfo.notice.type || "information"}
                text={dialogInfo.notice.text}
              />
            </View>
          ) : null}

          {dialogInfo.check ? (
            <>
              <Button
                onPress={() => {
                  setChecked(!checked);
                }}
                icon={
                  checked
                    ? "check-circle-outline"
                    : "checkbox-blank-circle-outline"
                }
                iconColor={
                  checked ? colors.secondary.icon : colors.primary.icon
                }
                style={{
                  justifyContent: "flex-start"
                }}
                height={35}
                iconSize={20}
                width="100%"
                title={dialogInfo.check.info}
                type={checked ? dialogInfo.check.type || "plain" : "plain"}
              />
            </>
          ) : null}

          <DialogButtons
            onPressNegative={onNegativePress}
            onPressPositive={
              (dialogInfo.positivePress || dialogInfo.form?.onFormSubmit) &&
              onPressPositive
            }
            loading={loading}
            positiveTitle={dialogInfo.positiveText}
            negativeTitle={dialogInfo.negativeText}
            positiveType={dialogInfo.positiveType}
          />
        </View>
      )}
      <Toast context="local" />
    </BaseDialog>
  ) : null;
};
