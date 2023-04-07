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

import React, { useRef, useState } from "react";
import { View } from "react-native";
import { useThemeStore } from "../../../stores/use-theme-store";
import Input from "../../ui/input";
import Paragraph from "../../ui/typography/paragraph";

export const ListHeaderInputItem = ({
  onSubmit,
  onChangeText,
  placeholder,
  testID
}) => {
  const [focused, setFocused] = useState(false);
  const colors = useThemeStore((state) => state.colors);
  const [inputValue, setInputValue] = useState();
  const inputRef = useRef();
  return (
    <View
      style={{
        width: "100%",
        marginTop: 10,
        marginBottom: 5
      }}
    >
      <Input
        fwdRef={inputRef}
        onChangeText={(value) => {
          setInputValue(value);
          onChangeText?.(value);
        }}
        testID={testID}
        blurOnSubmit={false}
        onFocusInput={() => {
          setFocused(true);
        }}
        onBlurInput={() => {
          setFocused(false);
        }}
        button={{
          icon: inputValue ? "plus" : "magnify",
          color: focused ? colors.accent : colors.icon,
          onPress: async () => {
            const result = await onSubmit(inputValue);
            if (result) {
              inputRef.current?.blur();
            }
          }
        }}
        placeholder={placeholder}
        marginBottom={5}
      />
      {inputValue ? (
        <View
          style={{
            backgroundColor: colors.shade,
            padding: 5,
            borderRadius: 5,
            marginBottom: 10
          }}
        >
          <Paragraph color={colors.accent}>
            Tap on + to add {`"${inputValue}"`}
          </Paragraph>
        </View>
      ) : null}
    </View>
  );
};
