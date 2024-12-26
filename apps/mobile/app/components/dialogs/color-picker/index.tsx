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
import { Color } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import ColorPickerWheel from "react-native-wheel-color-picker";
import { db } from "../../../common/database";
import { useStoredRef } from "../../../hooks/use-stored-ref";
import { ToastManager } from "../../../services/event-manager";
import { useMenuStore } from "../../../stores/use-menu-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useSettingStore } from "../../../stores/use-setting-store";
import BaseDialog from "../../dialog/base-dialog";
import DialogContainer from "../../dialog/dialog-container";
import { Toast } from "../../toast";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import { Pressable } from "../../ui/pressable";
import { strings } from "@notesnook/intl";

const HEX_COLOR_REGEX_ALPHA =
  /^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$/;

const ColorPicker = ({
  visible,
  setVisible,
  onColorAdded
}: {
  visible: boolean;
  setVisible: (value: boolean) => void;
  onColorAdded: (color: Color) => void;
}) => {
  const [selectedColor, setSelectedColor] = useState<string>();
  const { colors } = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const title = useRef<string>();
  const colorRef = useStoredRef("color-ref", "#f0f0f0");

  return (
    <BaseDialog
      visible={visible}
      onRequestClose={() => {
        title.current = undefined;
        setVisible(false);
        useSettingStore.getState().setSheetKeyboardHandler(true);
      }}
      statusBarTranslucent={false}
      centered
    >
      <Toast context="color-picker" />
      <DialogContainer
        style={{
          paddingTop: 0,
          maxHeight: 600
        }}
      >
        <View>
          <View
            style={{
              width: "100%",
              height: 250,
              backgroundColor: colors.primary.background,
              borderRadius: 10
            }}
          >
            <ColorPickerWheel
              onColorChangeComplete={(color) => {
                if (color === selectedColor) return;
                colorRef.current = color;
                setSelectedColor(color);
                inputRef.current?.setNativeProps({
                  placeholder: color,
                  text: color
                });
              }}
              useNativeLayout={true}
              autoResetSlider={true}
              color={colorRef.current}
              sliderSize={30}
              thumbSize={25}
              shadeWheelThumb
              shadeSliderThumb={true}
              swatchesOnly={false}
              swatches={false}
              useNativeDriver={true}
            />
          </View>

          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingTop: 10,
                columnGap: 10,
                marginBottom: 10
              }}
            >
              <Input
                fwdRef={inputRef}
                placeholder="#f0f0f0"
                marginBottom={0}
                onChangeText={(value) => {
                  if (HEX_COLOR_REGEX_ALPHA.test(value)) {
                    colorRef.current = value;
                    setSelectedColor(value);
                  }
                }}
                defaultValue={colorRef.current}
              />
              <Pressable
                type="accent"
                accentColor={selectedColor || colors.secondary.background}
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 100,
                  justifyContent: "center",
                  alignItems: "center"
                }}
              />
            </View>

            <Input
              marginBottom={10}
              onChangeText={(value) => {
                title.current = value;
              }}
              testID="color-title-input"
              defaultValue={title.current}
              placeholder={title.current || strings.colorTitle()}
            />

            <Button
              title={strings.addColor()}
              style={{
                marginBottom: 10
              }}
              onPress={async () => {
                if (!selectedColor)
                  return ToastManager.error(
                    new Error(strings.noColorSelected()),
                    undefined,
                    "color-picker"
                  );
                if (!title.current)
                  return ToastManager.error(
                    new Error(strings.allFieldsRequired())
                  );
                const exists = await db.colors.all.find((v) =>
                  v.and([v(`colorCode`, "==", selectedColor)])
                );
                if (exists)
                  return ToastManager.error(
                    new Error(strings.colorExists(selectedColor))
                  );
                const id = await db.colors.add({
                  title: title.current,
                  colorCode: selectedColor
                });
                if (!id) return;
                useRelationStore.getState().update();
                useMenuStore.getState().setColorNotes();
                setVisible(false);
                const color = await db.colors.color(id);
                if (color) {
                  onColorAdded?.(color);
                }
              }}
              type={selectedColor ? "secondaryAccented" : "secondary"}
              width="100%"
            />
          </View>
        </View>
      </DialogContainer>
    </BaseDialog>
  );
};

export default ColorPicker;
