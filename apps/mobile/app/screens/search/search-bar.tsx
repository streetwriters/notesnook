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
import React, { useRef } from "react";
import { Platform, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { IconButton } from "../../components/ui/icon-button";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import Navigation from "../../services/navigation";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSelectionStore } from "../../stores/use-selection-store";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
export const SearchBar = ({
  onChangeText,
  loading
}: {
  onChangeText: (value: string) => void;
  loading?: boolean;
}) => {
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const isFocused = useNavigationStore(
    (state) => state.focusedRouteId === "Search"
  );
  const insets = useGlobalSafeAreaInsets();
  const { colors } = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const _onChangeText = (value: string) => {
    onChangeText(value);
  };

  return selectionMode && isFocused ? null : (
    <View
      style={{
        width: "100%",
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingTop: Platform.OS === "ios" ? 0 : insets.top + 5
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          paddingHorizontal: DefaultAppStyles.GAP_SMALL,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
          borderRadius: 10,
          borderColor: colors.primary.border,
          borderWidth: 1
        }}
      >
        <IconButton
          name="arrow-left"
          size={SIZE.xxl}
          top={10}
          bottom={10}
          onPress={() => {
            Navigation.goBack();
          }}
          color={colors.primary.paragraph}
          type="plain"
        />

        <TextInput
          ref={inputRef}
          testID="search-input"
          style={{
            fontSize: SIZE.sm,
            fontFamily: "OpenSans-Regular",
            flexGrow: 1,
            color: colors.primary.paragraph,
            height: 40
          }}
          autoFocus
          onChangeText={_onChangeText}
          placeholder={strings.typeAKeyword()}
          textContentType="none"
          returnKeyLabel={strings.search()}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.primary.placeholder}
        />
      </View>
    </View>
  );
};
