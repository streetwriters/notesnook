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

export const Title = ({ text, style = {}, inline }) => {
  const announcements = useMessageStore((state) => state.announcements);
  let announcement = announcements.length > 0 ? announcements[0] : null;
  const remove = useMessageStore((state) => state.remove);

  return inline ? (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: inline ? 5 : 0
      }}
    >
      <Heading
        style={{
          marginHorizontal: 12,
          marginTop: 12,
          ...getStyle(style),
          textAlign: inline ? "left" : style?.textAlign,
          flexShrink: 1
        }}
        numberOfLines={1}
        size={inline ? AppFontSize.md : AppFontSize.xl}
      >
        {inline ? text?.toUpperCase() : text}
      </Heading>

      <Button
        type="plain"
        icon="close"
        height={null}
        onPress={() => {
          remove(announcement.id);
        }}
        hitSlop={{
          left: 15,
          top: 10,
          bottom: 10,
          right: 0
        }}
        iconSize={24}
        fontSize={AppFontSize.xs}
        style={{
          borderRadius: 100,
          paddingVertical: 0,
          paddingHorizontal: 0,
          marginRight: 12,
          zIndex: 10
        }}
      />
    </View>
  ) : (
    <Heading
      style={{
        marginHorizontal: 12,
        ...getStyle(style),
        marginTop: style?.marginTop || 12
      }}
    >
      {text}
    </Heading>
  );
};
