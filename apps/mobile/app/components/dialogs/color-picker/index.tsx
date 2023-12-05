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
import { isThemeColor, useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { FlashList } from "react-native-actions-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSettingStore } from "../../../stores/use-setting-store";
import { SIZE } from "../../../utils/size";
import BaseDialog from "../../dialog/base-dialog";
import DialogContainer from "../../dialog/dialog-container";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import { PressableButton } from "../../ui/pressable";
import { ToastManager } from "../../../services/event-manager";
import { Toast } from "../../toast";
import { db } from "../../../common/database";
import { useRelationStore } from "../../../stores/use-relation-store";
import { useMenuStore } from "../../../stores/use-menu-store";
const arrayOfColors = [
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7",
  "#FF5733",
  "#33FF57",
  "#339DFF",
  "#FF33E9",
  "#E9FF33",
  "#FF3395",
  "#95FF33",
  "#FF3369",
  "#6933FF",
  "#33FFC7"
];
const HEX_COLOR_REGEX_ALPHA =
  /^#(?:(?:[\da-fA-F]{3}){1,2}|(?:[\da-fA-F]{4}){1,2})$/;

const convertToColorObjects = (colors: string[]) => {
  const colorObjects = [];
  for (let i = 0; i < colors.length; i += 3) {
    colorObjects.push({
      colorOne: colors[i],
      colorTwo: colors[i + 1],
      colorThree: colors[i + 2]
    });
  }
  return colorObjects;
};

const ColorPicker = ({
  visible,
  setVisible
}: {
  visible: boolean;
  setVisible: (value: boolean) => void;
}) => {
  const [selectedColor, setSelectedColor] = useState<string>();
  const { colors } = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const title = useRef<string>();

  const renderItem = ({
    item
  }: {
    item: { colorOne: string; colorTwo: string; colorThree: string };
  }) => (
    <View>
      {Object.keys(item).map((key) => (
        <PressableButton
          key={item[key as keyof typeof item]}
          type="accent"
          accentColor={item[key as keyof typeof item]}
          customStyle={{
            width: 40,
            height: 40,
            borderRadius: 100,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
            marginBottom: 10
          }}
          onPress={() => {
            const color = item[key as keyof typeof item];
            setSelectedColor(color);
            inputRef.current?.setNativeProps({
              placeholder: color,
              text: color
            });
          }}
        >
          {selectedColor === item[key as keyof typeof item] ? (
            <Icon name="check" color="white" size={SIZE.lg} />
          ) : null}
        </PressableButton>
      ))}
    </View>
  );

  return (
    <BaseDialog
      visible={visible}
      onRequestClose={() => {
        setVisible(false);
        useSettingStore.getState().setSheetKeyboardHandler(true);
      }}
      statusBarTranslucent={false}
      centered
    >
      <Toast context="color-picker" />
      <DialogContainer
        style={{
          paddingTop: 0
        }}
      >
        <View
          style={{
            padding: 20
          }}
        >
          <FlashList
            extraData={selectedColor}
            horizontal
            data={convertToColorObjects(arrayOfColors)}
            renderItem={renderItem}
          />

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
                  setSelectedColor(value);
                  inputRef.current?.setNativeProps({
                    placeholder: value,
                    text: value
                  });
                }
              }}
            />
            <PressableButton
              type="accent"
              accentColor={selectedColor || colors.secondary.background}
              customStyle={{
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
            placeholder={title.current || "Color title"}
          />

          <Button
            title="Add color"
            onPress={async () => {
              if (!selectedColor)
                return ToastManager.error(
                  new Error("Select a color"),
                  undefined,
                  "color-picker"
                );
              if (!title.current)
                return ToastManager.error(
                  new Error("Enter a title for the color")
                );
              const exists = await db.colors.all.find((v) =>
                v.and([v(`colorCode`, "==", selectedColor)])
              );
              if (exists)
                return ToastManager.error(
                  new Error(`Color #${selectedColor} already exists`)
                );

              await db.colors.add({
                title: title.current,
                colorCode: selectedColor
              });
              useRelationStore.getState().update();
              useMenuStore.getState().setColorNotes();
              setVisible(false);
            }}
            type={selectedColor ? "grayAccent" : "grayBg"}
            width="100%"
          />
        </View>
      </DialogContainer>
    </BaseDialog>
  );
};

export default ColorPicker;
