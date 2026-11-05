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
import { formatBytes } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import React from "react";
import { View } from "react-native";
import { AppFontSize } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";

export function ImageSizeBadge({
  size,
  pending
}: {
  size?: number;
  pending?: boolean;
}) {
  if (!size && !pending) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 4,
        left: 4,
        right: 4,
        backgroundColor: "rgba(0,0,0,0.65)",
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        alignItems: "center"
      }}
    >
      <Paragraph
        size={AppFontSize.xxs}
        style={{ color: "#ffffff" }}
        numberOfLines={1}
        allowFontScaling={false}
      >
        {pending ? `${strings.compressing()}...` : formatBytes(size as number)}
      </Paragraph>
    </View>
  );
}
