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
import { View } from "react-native";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { getFormattedDate } from "../../utils/time";
import Paragraph from "../ui/typography/paragraph";
export const DateMeta = ({ item }) => {
  const colors = useThemeStore((state) => state.colors);

  const getNameFromKey = (key) => {
    switch (key) {
      case "dateCreated":
        return "Created at:";
      case "dateEdited":
        return "Last edited at:";
      case "dateModified":
        return "Last modified at:";
      case "dateDeleted":
        return "Deleted at:";
      case "dateUploaded":
        return "Uploaded at:";
      default:
        return key;
    }
  };

  function getDateMeta() {
    let keys = Object.keys(item);
    if (keys.includes("dateEdited"))
      keys.splice(
        keys.findIndex((k) => k === "dateModified"),
        1
      );
    return keys.filter((key) => key.startsWith("date") && key !== "date");
  }

  const renderItem = (key) => (
    <View
      key={key}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3
      }}
    >
      <Paragraph size={SIZE.xs} color={colors.icon}>
        {getNameFromKey(key)}
      </Paragraph>
      <Paragraph size={SIZE.xs} color={colors.icon}>
        {getFormattedDate(item[key], "date-time")}
      </Paragraph>
    </View>
  );

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}
    >
      {getDateMeta().map(renderItem)}
    </View>
  );
};
