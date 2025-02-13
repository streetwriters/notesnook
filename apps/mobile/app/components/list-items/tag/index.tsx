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

import { Tag } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { notesnook } from "../../../../e2e/test.ids";
import { TaggedNotes } from "../../../screens/notes/tagged";
import { AppFontSize } from "../../../utils/size";
import { Properties } from "../../properties";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import SelectionWrapper, { selectItem } from "../selection-wrapper";
import { strings } from "@notesnook/intl";

const TagItem = React.memo(
  ({
    item,
    index,
    totalNotes
  }: {
    item: Tag;
    index: number;
    totalNotes: number;
  }) => {
    const { colors } = useThemeColors();
    const onPress = () => {
      if (selectItem(item)) return;

      TaggedNotes.navigate(item, true);
    };

    return (
      <SelectionWrapper
        onPress={onPress}
        item={item}
        testID={notesnook.ids.tag.get(index)}
      >
        <View
          style={{
            flexGrow: 1,
            flexShrink: 1
          }}
        >
          <Heading size={AppFontSize.md}>
            <Heading
              size={AppFontSize.md}
              style={{
                color: colors.primary.accent
              }}
            >
              #
            </Heading>
            {item.title}
          </Heading>
          <Paragraph
            color={colors.secondary.paragraph}
            size={AppFontSize.xs}
            style={{
              marginTop: 5
            }}
          >
            {strings.notes(totalNotes)}
          </Paragraph>
        </View>

        <IconButton
          color={colors.primary.heading}
          name="dots-horizontal"
          size={AppFontSize.xl}
          onPress={() => {
            Properties.present(item);
          }}
          testID={notesnook.ids.tag.menu}
          style={{
            justifyContent: "center",
            height: 35,
            width: 35,
            borderRadius: 100,
            alignItems: "center"
          }}
        />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.item?.dateModified !== next.item?.dateModified) {
      return false;
    }

    return true;
  }
);

TagItem.displayName = "TagItem";

export default TagItem;
