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

import type { ReactNode } from "react";
import { Item } from "@notesnook/core";
import { Flex, Text, type ColorToken, type SxProp } from "@ui";
import { useStore as useSelectionStore } from "../../stores/selection-store";

type ListItemColors = {
  heading: ColorToken;
  accent: ColorToken;
  background: ColorToken;
  backgroundSelected: ColorToken;
};

type ListItemProps = {
  colors?: ListItemColors;
  isFocused?: boolean;
  isCompact?: boolean;
  isDisabled?: boolean;
  item: Item;
  onPress?: () => void;
  title: string | ReactNode;
  header?: ReactNode;
  body?: string;
  footer?: ReactNode;
  sx?: SxProp;
};

const DEFAULT_COLORS: ListItemColors = {
  heading: "heading",
  accent: "accent",
  background: "background",
  backgroundSelected: "background-secondary"
};

export default function ListItem(props: ListItemProps) {
  const {
    colors = DEFAULT_COLORS,
    isFocused,
    isCompact,
    isDisabled,
    item
  } = props;
  const isSelected = useSelectionStore((store) => {
    const isInSelection = store.selectedItems.includes(item.id);
    return isFocused
      ? store.selectedItems.length > 1 && isInSelection
      : isInSelection;
  });
  const selected = isSelected || isFocused;

  return (
    <Flex
      testID={`list-item-${item.id}`}
      onPress={props.onPress}
      sx={{
        flexDirection: isCompact ? "row" : "column",
        justifyContent: isCompact ? "space-between" : "center",
        alignItems: isCompact ? "center" : "stretch",
        maxWidth: "100%",
        overflow: "hidden",
        opacity: isDisabled ? 0.7 : 1,
        bg: selected ? colors.backgroundSelected : colors.background,
        ":hover": { bg: selected ? "hover-selected" : "hover" },
        ...props.sx
      }}
    >
      {!isCompact ? props.header : null}
      <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
        {typeof props.title === "string" ? (
          <Text
            testID="title"
            variant="body"
            sx={{
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              fontWeight: isCompact ? "body" : "medium",
              color:
                selected && colors.heading === "heading"
                  ? "heading-selected"
                  : colors.heading
            }}
          >
            {props.title}
          </Text>
        ) : (
          props.title
        )}
        {!isCompact && props.body ? (
          <Text
            testID="description"
            numberOfLines={4}
            sx={{
              color: "paragraph",
              fontSize: "xs",
              width: "100%",
              lineHeight: 1.4
            }}
          >
            {props.body}
          </Text>
        ) : null}
      </Flex>
      {props.footer}
    </Flex>
  );
}
