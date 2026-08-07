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
import { View } from "react-native";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import { hideAuth } from "./common";
import { AuthParams } from "../../stores/use-navigation-store";
import { ProgressPills } from "../intro/progress-pills";
import { FontSizes } from "../../common/design/font";
import { Spacing } from "../../common/design/spacing";
export const AuthHeader = (props: { welcome?: boolean }) => {
  const { colors } = useThemeColors();
  const route = useRoute();

  return (
    <View
      style={{
        width: "100%"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: Spacing.LEVEL_3,
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {props.welcome ? (
          <ProgressPills activePillIndex={1} />
        ) : (
          <IconButton
            name="arrow-back"
            iconFamily="notesnook"
            onPress={() => {
              hideAuth((route.params as AuthParams)?.context);
            }}
            size={24}
            color={colors.primary.paragraph}
          />
        )}

        {!props.welcome ? null : (
          <Button
            title="Skip"
            onPress={() => {
              hideAuth();
            }}
            iconSize={24}
            fontSize={FontSizes.SM}
            type="plain"
            fontFamily="REGULAR"
            iconPosition="right"
            icon="chevron-right"
            style={{
              paddingRight: 0,
              paddingHorizontal: 0,
              paddingVertical: 0
            }}
          />
        )}
      </View>
    </View>
  );
};
