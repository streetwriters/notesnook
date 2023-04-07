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
import { Text } from "react-native";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";

export const Offer = ({
  off = "30",
  text = "on yearly plan, offer ends soon",
  padding = 0
}) => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Paragraph
      style={{
        textAlign: "center",
        paddingVertical: padding
      }}
      size={SIZE.xxxl}
    >
      GET {off}
      <Text style={{ color: colors.accent }}>%</Text> OFF!{"\n"}
      <Paragraph color={colors.icon}>{text}</Paragraph>
    </Paragraph>
  );
};
