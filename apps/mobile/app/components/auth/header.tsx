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
import { useRoute } from "@react-navigation/native";
import React from "react";
import { Platform, View } from "react-native";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { hideAuth } from "./common";
export const AuthHeader = (props: { welcome?: boolean }) => {
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  const route = useRoute();

  return (
    <View
      style={{
        paddingTop: Platform.OS === "android" ? 0 : insets.top,
        width: "100%"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          width: "100%",
          height: 50,
          justifyContent: !props.welcome ? "space-between" : "flex-end"
        }}
      >
        {props.welcome ? null : (
          <IconButton
            name="arrow-left"
            onPress={() => {
              hideAuth((route.params as any)?.context);
            }}
            color={colors.primary.paragraph}
          />
        )}

        {!props.welcome ? null : (
          <Button
            title="Skip"
            onPress={() => {
              hideAuth();
            }}
            iconSize={16}
            type="plain"
            iconPosition="right"
            icon="chevron-right"
            height={25}
            iconStyle={{
              marginTop: 2
            }}
            style={{
              paddingHorizontal: 6
            }}
          />
        )}
      </View>
    </View>
  );
};
