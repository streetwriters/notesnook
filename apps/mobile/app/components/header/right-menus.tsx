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
import { StyleSheet, View } from "react-native";
import { IconButton, IconButtonProps } from "../ui/icon-button";

export const RightMenus = ({
  rightButton
}: {
  rightButton?: IconButtonProps;
}) => {
  const { colors } = useThemeColors();

  return (
    <View style={styles.rightBtnContainer}>
      {rightButton ? (
        <IconButton {...rightButton} color={colors.primary.icon} />
      ) : (
        <View
          style={{
            width: 40,
            height: 40
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rightBtnContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  rightBtn: {
    justifyContent: "center",
    alignItems: "center"
  }
});
