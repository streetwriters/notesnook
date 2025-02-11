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

import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { getElevationStyle } from "../../utils/elevation";
import { eCloseSimpleDialog, eOpenSimpleDialog } from "../../utils/events";
import { sleep } from "../../utils/time";
import { Toast } from "../toast";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import BaseDialog from "./base-dialog";
import DialogButtons from "./dialog-buttons";
import DialogHeader from "./dialog-header";
import { useCallback } from "react";
import { Button } from "../ui/button";
import { getContainerBorder } from "../../utils/colors";
import { Notice } from "../ui/notice";
import { strings } from "@notesnook/intl";

export const Dialog = ({ context = "global" }) => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const values = useRef({
    inputValue: undefined
  });
  const inputRef = useRef();
  const [dialogInfo, setDialogInfo] = useState({
    title: "",
    paragraph: "",
    positiveText: strings.done(),
    negativeText: strings.cancel(),
    positivePress: () => {},
    onClose: () => {},
    positiveType: "transparent",
    icon: null,
    paragraphColor: colors.primary.paragraph,
    input: false,
    inputPlaceholder: "Enter some text",
    defaultValue: "",
    disableBackdropClosing: false,
    check: {
      info: "Check",
      type: "transparent",
      defaultValue: false
    }
  });

  const onPressPositive = async () => {
    if (dialogInfo.positivePress) {
      inputRef.current?.blur();
      let result = await dialogInfo.positivePress(
        values.current.inputValue || dialogInfo.defaultValue,
        checked
      );
      if (result === false) {
        return;
      }
    }
    setChecked(false);
    values.current.inputValue = undefined;
    setVisible(false);
  };

  const show = useCallback(
    (data) => {
      if (!data.context) data.context = "global";
      if (data.context !== context) return;
      setDialogInfo(data);
      setChecked(data.check?.defaultValue);
      values.current.inputValue = data.defaultValue;
      setVisible(true);
    },
    [context]
  );

  useEffect(() => {
    eSubscribeEvent(eOpenSimpleDialog, show);
    eSubscribeEvent(eCloseSimpleDialog, hide);

    return () => {
      eUnSubscribeEvent(eOpenSimpleDialog, show);
      eUnSubscribeEvent(eCloseSimpleDialog, hide);
    };
  }, [hide, show]);

  const hide = React.useCallback(() => {
    setChecked(false);
    values.current.inputValue = undefined;
    setVisible(false);
    dialogInfo.onClose?.();
  }, [dialogInfo]);

  const onNegativePress = async () => {
    if (dialogInfo.onClose) {
      await dialogInfo.onClose();
    }
    hide();
  };

  const style = {
    ...getElevationStyle(5),
    width: DDS.isTab ? 400 : "85%",
    maxHeight: 450,
    borderRadius: 5,
    backgroundColor: colors.primary.background,
    paddingTop: 12,
    ...getContainerBorder(colors.primary.border, 0.5)
  };

  return visible ? (
    <BaseDialog
      statusBarTranslucent={false}
      bounce={!dialogInfo.input}
      closeOnTouch={!dialogInfo.disableBackdropClosing}
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
              paddingHorizontal: 12
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
              onSubmit={onPressPositive}
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
              paddingHorizontal: 12
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
          positiveTitle={dialogInfo.positiveText}
          negativeTitle={dialogInfo.negativeText}
          positiveType={dialogInfo.positiveType}
        />
      </View>
      <Toast context="local" />
    </BaseDialog>
  ) : null;
};
