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
import React from "react";
import { View } from "react-native";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import Paragraph from "../ui/typography/paragraph";
import { SideMenuHeader } from "./side-menu-header";

type SideMenuListEmptyProps = {
  placeholder: string;
  isLoading?: boolean;
};

export const SideMenuListEmpty = (props: SideMenuListEmptyProps) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        width: "100%",
        height: "100%"
      }}
    >
      <View
        style={{
          backgroundColor: colors.primary.background,
          paddingTop: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <SideMenuHeader />
      </View>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1
        }}
      >
        {props.isLoading ? (
          <View
            style={{
              flex: 1,
              width: "100%",
              paddingHorizontal: DefaultAppStyles.GAP
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={"placeholder" + i}
                style={{
                  paddingVertical: DefaultAppStyles.GAP - 1,
                  width: i === 4 ? "80%" : "100%",
                  borderRadius: defaultBorderRadius,
                  backgroundColor: colors.secondary.background,
                  marginTop: DefaultAppStyles.GAP_VERTICAL,
                  opacity: 0.5
                }}
              />
            ))}
          </View>
        ) : (
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {props.placeholder}
          </Paragraph>
        )}
      </View>
    </View>
  );
};
