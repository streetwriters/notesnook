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
import { useMessageStore } from "../../stores/use-message-store";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import { getStyle } from "./functions";
import { DefaultAppStyles } from "../../utils/styles";

export const Title = ({ text, style = {}, inline }) => {
  return inline ? (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: inline ? DefaultAppStyles.GAP_VERTICAL_SMALL : 0
      }}
    >
      <Heading
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          marginTop: DefaultAppStyles.GAP_VERTICAL,
          ...getStyle(style),
          textAlign: inline ? "left" : style?.textAlign,
          flexShrink: 1
        }}
        size={inline ? AppFontSize.md : AppFontSize.xl}
      >
        {inline ? text?.toUpperCase() : text}
      </Heading>
    </View>
  ) : (
    <Heading
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        ...getStyle(style),
        marginTop: style?.marginTop || DefaultAppStyles.GAP_VERTICAL
      }}
    >
      {text}
    </Heading>
  );
};
