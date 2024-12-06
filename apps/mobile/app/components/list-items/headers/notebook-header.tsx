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

import { getFormattedDate } from "@notesnook/common";
import { Notebook } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { SIZE } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import AppIcon from "../../ui/AppIcon";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export const NotebookHeader = ({
  notebook,
  totalNotes = 0
}: {
  notebook: Notebook;
  totalNotes: number;
}) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        marginVertical: DefaultAppStyles.GAP,
        backgroundColor: colors.secondary.background
      }}
    >
      <View
        style={{
          width: "100%",
          gap: DefaultAppStyles.GAP_VERTICAL,
          paddingVertical: 25
        }}
      >
        <AppIcon name="notebook" size={SIZE.xxl} />
        <Heading size={SIZE.lg}>{notebook.title}</Heading>

        {notebook.description ? (
          <Paragraph size={SIZE.sm} color={colors.primary.paragraph}>
            {notebook.description}
          </Paragraph>
        ) : null}

        <View
          style={{
            flexDirection: "row",
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          <Paragraph size={SIZE.xxs} color={colors.secondary.paragraph}>
            {strings.notes(totalNotes || 0)}
          </Paragraph>

          <Paragraph color={colors.secondary.paragraph} size={SIZE.xxs}>
            {getFormattedDate(notebook.dateModified, "date-time")}
          </Paragraph>
        </View>
      </View>
    </View>
  );
};
