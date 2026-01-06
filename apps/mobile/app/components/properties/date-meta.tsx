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

import React, { useState } from "react";
import { View } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../utils/styles";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { db } from "../../common/database";
import { Item } from "@notesnook/core";
import AppIcon from "../ui/AppIcon";
export const DateMeta = ({ item }: { item: Item }) => {
  const { colors, isDark } = useThemeColors();
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [dateCreated, setDateCreated] = useState(item.dateCreated);

  function getDateMeta() {
    let keys = Object.keys(item);
    if (keys.includes("dateEdited"))
      keys.splice(
        keys.findIndex((k) => k === "dateModified"),
        1
      );
    return keys.filter((key) => key.startsWith("date") && key !== "date");
  }

  const renderItem = (key: string) =>
    !item[key as keyof Item] ? null : (
      <View
        key={key}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL / 2
        }}
      >
        <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
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
          size={AppFontSize.xs}
          color={colors.secondary.paragraph}
          onPress={() => {
            setIsDatePickerVisible(true);
          }}
        >
          {getFormattedDate(
            key === "dateCreated"
              ? dateCreated
              : (item[key as keyof Item] as string),
            "date-time"
          )}
          {key === "dateCreated" ? (
            <>
              {" "}
              <AppIcon name="pencil" size={AppFontSize.md} />
            </>
          ) : null}
        </Paragraph>
      </View>
    );

  return (
    <>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={async (date: Date) => {
          await db.notes.add({
            id: item.id,
            dateCreated: date.getTime()
          });
          setDateCreated(date.getTime());
          setIsDatePickerVisible(false);
        }}
        onCancel={() => {
          setIsDatePickerVisible(false);
        }}
        isDarkModeEnabled={isDark}
        is24Hour={db.settings.getTimeFormat() === "24-hour"}
        date={new Date(dateCreated)}
      />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.primary.border,
          paddingHorizontal: DefaultAppStyles.GAP,
          paddingTop: DefaultAppStyles.GAP_VERTICAL_SMALL
        }}
      >
        {getDateMeta().map(renderItem)}
      </View>
    </>
  );
};
