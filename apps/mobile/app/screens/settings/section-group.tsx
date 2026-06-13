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
import React from "react";
import { View } from "react-native";
import { Spacing } from "../../common/design/spacing";
import Heading from "../../components/ui/typography/heading";
import { AppFontSize } from "../../utils/size";
import { SectionItem } from "./section-item";
import { SettingSection } from "./types";
export const SectionGroup = ({
  item,
  isLast
}: {
  item: SettingSection;
  isLast?: boolean;
}) => {
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
            paddingHorizontal: Spacing.LEVEL_3,
            marginBottom: Spacing.LEVEL_2
          }}
          color={colors.secondary.paragraph}
          size={AppFontSize.sm}
          fontFamily="MEDIUM"
        >
          {item.name as string}
        </Heading>
      ) : null}

      {item.sections?.map((sectionItem, index) =>
        sectionItem.type === "group" ? (
          <SectionGroup
            key={sectionItem.id}
            item={sectionItem}
            isLast={!item.sections?.[index + 1]}
          />
        ) : (
          <SectionItem key={sectionItem.id as string} item={sectionItem} />
        )
      )}

      {isLast ? null : (
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3,
            width: "100%"
          }}
        >
          <View
            style={{
              height: 1,
              width: "100%",
              backgroundColor: colors.primary.border
            }}
          />
        </View>
      )}
    </View>
  );
};
