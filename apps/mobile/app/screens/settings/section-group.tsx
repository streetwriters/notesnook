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
import Heading from "../../components/ui/typography/heading";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../utils/size";
import { SectionItem } from "./section-item";
import { SettingSection } from "./types";
export const SectionGroup = ({ item }: { item: SettingSection }) => {
  const { colors } = useThemeColors();
  const current = item.useHook && item.useHook();
  const isHidden = item.hidden && item.hidden(current);
  return isHidden ? null : (
    <View
      style={{
        marginVertical: item.sections ? 10 : 0
      }}
    >
      {item.name && item.sections ? (
        <Heading
          style={{
            paddingHorizontal: 12
          }}
          color={colors.primary.accent}
          size={AppFontSize.xs}
        >
          {(item.name as string).toUpperCase()}
        </Heading>
      ) : null}

      {item.sections?.map((item) => (
        <SectionItem key={item.name as string} item={item} />
      ))}
    </View>
  );
};
