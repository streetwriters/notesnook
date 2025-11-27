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
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import Heading from "../ui/typography/heading";
import { BodyItemProps, getStyle } from "./functions";

export const Title = (props: BodyItemProps) => {
  return props.inline ? (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: props.inline ? DefaultAppStyles.GAP_VERTICAL_SMALL : 0
      }}
    >
      <Heading
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          marginTop: DefaultAppStyles.GAP_VERTICAL,
          ...getStyle(props.item.style),
          textAlign: props.inline ? "left" : props.item.style?.textAlign,
          flexShrink: 1
        }}
        size={props.inline ? AppFontSize.md : AppFontSize.xl}
      >
        {props.item.text?.toUpperCase()}
      </Heading>
    </View>
  ) : (
    <Heading
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        ...getStyle(props.item.style)
      }}
    >
      {props.item.text}
    </Heading>
  );
};
