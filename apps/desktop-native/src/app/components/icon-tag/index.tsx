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

import { strings } from "@notesnook/intl";
import {
  Button,
  Flex,
  Text,
  type ColorValue,
  type PressEvent,
  type SxProp
} from "@ui";
import { Close, type Icon } from "../icons";

type IconTagProps = {
  text: string;
  title?: string;
  icon: Icon;
  iconSize?: number;
  onClick?: (event: PressEvent) => void;
  styles?: {
    icon?: { color?: ColorValue };
    text?: { color?: ColorValue; fontSize?: SxProp["fontSize"] };
  };
  testId?: string;
  highlight?: boolean;
  selected?: boolean;
  chip?: boolean;
  containerSx?: SxProp;
  onDismiss?: () => void;
};

function IconTag(props: IconTagProps) {
  const {
    icon: IconComponent,
    text,
    title,
    iconSize = 11,
    onClick,
    onDismiss,
    styles,
    testId,
    highlight,
    selected,
    chip = true,
    containerSx
  } = props;

  return (
    <Flex
      testID={testId}
      title={title || text}
      onPress={
        onClick
          ? (event) => {
              event.stopPropagation();
              onClick(event);
            }
          : undefined
      }
      sx={{
        flexDirection: "row",
        alignItems: "center",
        bg: selected ? "background-tertiary" : "background-secondary",
        borderRadius: 26,
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
        gap: "spacing2",
        justifyContent: "center",
        maxWidth: "100%",
        overflow: "hidden",
        px: "spacing2",
        py: "spacing1",
        ...(chip
          ? {
              ":group-hover": {
                group: "list-item",
                style: { bg: "background-tertiary" }
              }
            }
          : {}),
        ...containerSx
      }}
    >
      <IconComponent
        size={iconSize}
        color={styles?.icon?.color ?? (highlight ? "accent" : "icon-secondary")}
      />
      <Text
        numberOfLines={1}
        sx={{
          color: styles?.text?.color ?? (highlight ? "accent" : "paragraph"),
          fontSize: styles?.text?.fontSize ?? "3xs",
          fontWeight: "medium"
        }}
      >
        {text}
      </Text>
      {onDismiss ? (
        <Button
          variant="secondary"
          title={strings.remove()}
          onPress={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDismiss();
          }}
          sx={{
            flexShrink: 0,
            height: 15,
            width: 15,
            alignItems: "center",
            justifyContent: "center",
            p: 0,
            border: "none",
            ml: "spacing1",
            borderRadius: "radius1",
            bg: "transparent"
          }}
        >
          <Close size={11} />
        </Button>
      ) : null}
    </Flex>
  );
}
export default IconTag;
