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
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import AppIcon from "../../ui/AppIcon";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import NotebookScreen from "../../../screens/notebook";
import { db } from "../../../common/database";

export const NotebookHeader = ({
  notebook,
  totalNotes = 0,
  breadcrumbs
}: {
  notebook: Notebook;
  totalNotes: number;
  breadcrumbs: { id: string; title: string }[];
}) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        marginTop: DefaultAppStyles.GAP,
        backgroundColor: colors.secondary.background
      }}
    >
      <View
        style={{
          width: "100%",
          gap: DefaultAppStyles.GAP_VERTICAL,
          paddingVertical: DefaultAppStyles.GAP
        }}
      >
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              paddingBottom: DefaultAppStyles.GAP_VERTICAL_SMALL
            }}
          >
            {breadcrumbs.map((item, index) => (
              <Pressable
                onPress={async () => {
                  const notebook = await db.notebooks.notebook(item.id);
                  if (!notebook) return;
                  NotebookScreen.navigate(notebook, true);
                }}
                key={item.id}
                style={{
                  width: undefined,
                  flexDirection: "row",
                  paddingHorizontal: 0,
                  alignItems: "center"
                }}
              >
                {index === 0 ? null : (
                  <IconButton
                    name="chevron-right"
                    size={16}
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    style={{ width: 20, height: 25 }}
                  />
                )}
                <Paragraph size={AppFontSize.xs}>{item.title}</Paragraph>
              </Pressable>
            ))}
          </View>
        ) : null}

        <AppIcon name="notebook" size={AppFontSize.xxl} />

        <View>
          <Heading size={AppFontSize.lg}>{notebook.title}</Heading>
          {notebook.description ? (
            <Paragraph size={AppFontSize.sm} color={colors.primary.paragraph}>
              {notebook.description}
            </Paragraph>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          <Paragraph size={AppFontSize.xxs} color={colors.secondary.paragraph}>
            {strings.notes(totalNotes || 0)}
          </Paragraph>

          <Paragraph color={colors.secondary.paragraph} size={AppFontSize.xxs}>
            {getFormattedDate(notebook.dateModified, "date-time")}
          </Paragraph>
        </View>
      </View>
    </View>
  );
};
