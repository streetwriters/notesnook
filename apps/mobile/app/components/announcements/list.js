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
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Paragraph from "../ui/typography/paragraph";
import { getStyle } from "./functions";

export const List = ({ items, listType, style = {} }) => {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingLeft: listType === "ordered" ? 25 : 25,
        ...getStyle(style)
      }}
    >
      {items.map((item, index) => (
        <View
          key={item.text}
          style={{
            paddingVertical: 6,
            flexDirection: "row"
          }}
        >
          {listType === "ordered" ? (
            <Paragraph
              style={{
                marginRight: 5
              }}
            >
              {index + 1}.
            </Paragraph>
          ) : (
            <Icon size={20} name="circle-small" />
          )}
          <Paragraph>{item.text}</Paragraph>
        </View>
      ))}
    </View>
  );
};
