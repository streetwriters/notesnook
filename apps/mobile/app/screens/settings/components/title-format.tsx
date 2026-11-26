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
import { useThemeColors } from "@notesnook/theme";
import { strings } from "@notesnook/intl";
import React, { useState } from "react";
import { View } from "react-native";
import { db } from "../../../common/database";
import { Radius, Spacing } from "../../../common/design/spacing";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";

const TITLE_FORMAT_TOKENS: { token: string; title: () => string }[] = [
  { token: "$date$", title: strings.titleFormatCurrentDate },
  { token: "$time$", title: strings.titleFormatCurrentTime },
  { token: "$day$", title: strings.titleFormatCurrentDay },
  { token: "$timestamp$", title: strings.titleFormatTimestamp },
  { token: "$count$", title: strings.titleFormatNoteCount },
  { token: "$headline$", title: strings.titleFormatHeadline }
];

export const TitleFormat = () => {
  const [titleFormat, setTitleFormat] = useState(
    db.settings.getTitleFormat() || ""
  );
  const { colors } = useThemeColors();

  const updateFormat = (value: string) => {
    setTitleFormat(value);
    db.settings.setTitleFormat(value);
  };

  return (
    <View
      style={{
        width: "100%",
        gap: Spacing.LEVEL_2
      }}
    >
      <Input
        value={titleFormat}
        onChangeText={updateFormat}
        onSubmit={(e) => updateFormat(e.nativeEvent.text)}
        containerStyle={{
          borderWidth: 0,
          backgroundColor: colors.secondary.background
        }}
        inputStyle={{
          color: colors.primary.heading
        }}
      />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: DefaultAppStyles.GAP_SMALL
        }}
      >
        {TITLE_FORMAT_TOKENS.map((item) => (
          <Button
            key={item.token}
            title={item.title()}
            type="secondary"
            bold={false}
            fontSize={AppFontSize.xs}
            onPress={() => updateFormat(`${titleFormat}${item.token}`)}
            fontFamily="REGULAR"
            style={{
              paddingHorizontal: Spacing.LEVEL_2,
              paddingVertical: Spacing.LEVEL_1,
              borderRadius: Radius.XS,
              width: undefined,
              borderWidth: 0
            }}
          />
        ))}
      </View>
    </View>
  );
};
