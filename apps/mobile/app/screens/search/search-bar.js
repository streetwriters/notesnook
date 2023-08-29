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
import { TextInput } from "react-native-gesture-handler";
import { IconButton } from "../../components/ui/icon-button";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import SearchService from "../../services/search";
import { useSearchStore } from "../../stores/use-search-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
export const SearchBar = () => {
  const { colors } = useThemeColors();
  const [value, setValue] = useState(null);
  const inputRef = useRef();
  const setSearchResults = useSearchStore((state) => state.setSearchResults);
  const setSearchStatus = useSearchStore((state) => state.setSearchStatus);
  const searchingRef = useRef(0);
  const onClear = () => {
    //inputRef.current?.blur();
    inputRef.current?.clear();
    setValue(0);
    SearchService.setTerm(null);
    setSearchResults([]);
    setSearchStatus(false, null);
  };

  useEffect(() => {
    sleep(300).then(() => {
      inputRef.current?.focus();
    });
  }, []);

  const onChangeText = (value) => {
    setValue(value);
    search(value);
  };

  const search = (value) => {
    clearTimeout(searchingRef.current);
    searchingRef.current = setTimeout(async () => {
      try {
        if (value === "" || !value) {
          setSearchResults([]);
          setSearchStatus(false, null);
          return;
        }
        if (value?.length > 0) {
          SearchService.setTerm(value);
          await SearchService.search();
        }
      } catch (e) {
        console.log(e);
        ToastManager.show({
          heading: "Error occured while searching",
          message: e.message,
          type: "error"
        });
      }
    }, 300);
  };

  return (
    <View
      style={{
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        width: "100%"
      }}
    >
      <IconButton
        name="arrow-left"
        size={SIZE.xl}
        top={10}
        bottom={10}
        onPress={() => {
          SearchService.setTerm(null);
          Navigation.goBack();
        }}
        color={colors.primary.paragraph}
        type="gray"
        customStyle={{
          paddingLeft: 0,
          marginLeft: 0,
          marginRight: 5
        }}
      />

      <TextInput
        ref={inputRef}
        testID="search-input"
        style={{
          fontSize: SIZE.md + 1,
          fontFamily: "OpenSans-Regular",
          flexGrow: 1,
          height: "100%",
          color: colors.primary.paragraph
        }}
        onChangeText={onChangeText}
        placeholder="Type a keyword"
        textContentType="none"
        returnKeyLabel="Search"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.primary.placeholder}
      />

      {value && value.length > 0 ? (
        <IconButton
          name="close"
          size={SIZE.md + 2}
          top={20}
          bottom={20}
          right={20}
          onPress={onClear}
          type="grayBg"
          color={colors.primary.icon}
          customStyle={{
            width: 25,
            height: 25
          }}
        />
      ) : null}
    </View>
  );
};
