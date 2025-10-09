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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

  const onPressPositive = async () => {
    if (dialogInfo?.positivePress) {
      inputRef.current?.blur();
      setLoading(true);
      let result = false;
      try {
        result = await dialogInfo.positivePress(
          values.current.inputValue || dialogInfo.defaultValue,
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
    setVisible(false);
  };

  const show = useCallback(
    (data: DialogInfo) => {
      if (!data.context) data.context = "global";
      if (data.context !== context) return;
      setDialogInfo(data);
      setChecked(data.check?.defaultValue);
      values.current.inputValue = data.defaultValue;
      setVisible(true);
    },
    [context]
  );

  const hide = React.useCallback(() => {
    setChecked(false);
    values.current.inputValue = undefined;
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
      bounce={!dialogInfo.input}
      closeOnTouch={!dialogInfo.disableBackdropClosing}
      background={dialogInfo.background}
      transparent={
        dialogInfo.transparent === undefined ? true : dialogInfo.transparent
      }
      onShow={async () => {
        if (dialogInfo.input) {
          inputRef.current?.setNativeProps({
            text: dialogInfo.defaultValue
          });
          await sleep(300);
          inputRef.current?.focus();
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

          {dialogInfo.input ? (
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
                //defaultValue={dialogInfo.defaultValue}
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
            onPressPositive={dialogInfo.positivePress && onPressPositive}
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
