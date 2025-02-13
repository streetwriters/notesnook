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

import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Paragraph from "../ui/typography/paragraph";
import { getColorLinearShade } from "../../utils/colors";
import { strings } from "@notesnook/intl";

const DialogButtons = ({
  onPressPositive,
  onPressNegative,
  positiveTitle,
  negativeTitle = strings.cancel(),
  loading,
  doneText,
  positiveType
}) => {
  const { colors, isDark } = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.secondary.background,
          height: 60,
          paddingHorizontal: 12,
          borderTopWidth: 0.7,
          borderTopColor: getColorLinearShade(
            colors.secondary.background,
            0.05,
            isDark
          )
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={colors.primary.accent}
          size={AppFontSize.lg}
        />
      ) : doneText ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          <Icon
            color={colors.primary.accent}
            name="check-circle-outline"
            size={AppFontSize.md}
          />
          <Paragraph color={colors.primary.accent}>{" " + doneText}</Paragraph>
        </View>
      ) : (
        <View />
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <Button
          onPress={onPressNegative}
          fontSize={AppFontSize.md}
          testID={notesnook.ids.default.dialog.no}
          type="plain"
          bold
          title={negativeTitle}
        />
        {onPressPositive ? (
          <Button
            onPress={onPressPositive}
            fontSize={AppFontSize.md}
            testID={notesnook.ids.default.dialog.yes}
            style={{
              marginLeft: 10
            }}
            bold
            type={positiveType || "transparent"}
            title={positiveTitle}
          />
        ) : null}
      </View>
    </View>
  );
};

export default DialogButtons;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginTop: 10
  }
});
