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
import { Item, Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { db } from "../../common/database";
import { Radius, Spacing } from "../../common/design/spacing";
import { presentDateTimePicker } from "../date-time-picker";
import AppIcon from "../ui/AppIcon";
import Paragraph from "../ui/typography/paragraph";
export const DateMeta = ({ item }: { item: Item }) => {
  const { colors } = useThemeColors();
  const [dateCreated, setDateCreated] = useState(item.dateCreated);

  const editDateCreated = () => {
    presentDateTimePicker({
      context: "properties",
      mode: "datetime",
      title: strings.changeCreatedDate(),
      description: strings.changeCreatedDateDesc(),
      confirmText: strings.change(),
      date: new Date(dateCreated),
      maxDate: new Date((item as Note).dateEdited),
      onConfirm: async (date) => {
        await db.notes.add({
          id: item.id,
          dateCreated: date.getTime()
        });
        setDateCreated(date.getTime());
      }
    });
  };

  function getDateMeta() {
    const keys = Object.keys(item);
    if (keys.includes("dateEdited"))
      keys.splice(
        keys.findIndex((k) => k === "dateModified"),
        1
      );
    return keys.filter((key) => key.startsWith("date") && key !== "date");
  }

  const renderItem = (key: string) =>
    !item[key as keyof Item] ? null : (
      <TouchableOpacity
        key={key}
        activeOpacity={1}
        onPress={
          item.type !== "note" || key !== "dateCreated"
            ? undefined
            : editDateCreated
        }
        style={{
          flexDirection: "row",
          width: "48.5%",
          justifyContent: "space-between",
          backgroundColor: colors.secondary.background,
          borderRadius: Radius.XS,
          padding: Spacing.LEVEL_2,
          gap: Spacing.LEVEL_1,
          alignItems: "center"
        }}
      >
        <View
          style={{
            gap: Spacing.LEVEL_0
          }}
        >
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {strings.dateDescFromKey(
              key as
                | "dateDeleted"
                | "dateEdited"
                | "dateModified"
                | "dateCreated"
                | "dateUploaded"
            )}
          </Paragraph>
          <Paragraph
            fontSize="XS"
            color={colors.primary.heading}
            fontFamily="MEDIUM"
          >
            {getFormattedDate(
              key === "dateCreated"
                ? dateCreated
                : (item[key as keyof Item] as string),
              "date-time"
            )}
          </Paragraph>
        </View>

        {key === "dateCreated" && item.type === "note" ? (
          <>
            <AppIcon name="edit-pencil" size={16} iconFamily="notesnook" />
          </>
        ) : null}
      </TouchableOpacity>
    );

  return (
    <View
      style={{
        flexDirection: "row",
        gap: Spacing.LEVEL_2
      }}
    >
      {getDateMeta().map(renderItem)}
    </View>
  );
};
