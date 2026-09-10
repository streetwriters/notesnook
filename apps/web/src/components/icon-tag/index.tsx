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

import { Flex, Text } from "@theme-ui/components";
import { ThemeUICSSObject } from "@theme-ui/core";
import { Close, Icon } from "../icons";
import { strings } from "@notesnook/intl";

type IconTagProps = {
  text: string;
  title?: string;
  icon: Icon;
  iconSize?: number;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  styles?: {
    icon?: ThemeUICSSObject;
    container?: ThemeUICSSObject;
    text?: ThemeUICSSObject;
  };
  testId?: string;
  highlight?: boolean;
  selected?: boolean;
  onDismiss?: () => void;
};

function IconTag(props: IconTagProps) {
  const {
    icon: Icon,
    text,
    title,
    iconSize = 11,
    className,
    onClick,
    onDismiss,
    styles,
    testId,
    highlight,
    selected
  } = props;

  return (
    <Flex
      className={className}
      data-test-id={testId}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      title={title || text}
      sx={{
        alignItems: "center",
        backgroundColor: selected
          ? "background-tertiary"
          : "background-secondary",
        borderRadius: "26px",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
        gap: "spacing2",
        justifyContent: "center",
        maxWidth: "100%",
        overflow: "hidden",
        px: "spacing2",
        py: "spacing1",
        ...styles?.container
      }}
    >
      <Icon
        size={iconSize}
        color={highlight ? "accent" : "icon-secondary"}
        sx={{ flexShrink: 0, ...styles?.icon }}
      />
      <Text
        sx={{
          color: highlight ? "accent" : "paragraph",
          fontSize: "xxs",
          fontWeight: "medium",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ...styles?.text
        }}
      >
        {text}
      </Text>
      {onDismiss && (
        <Close
          size={12}
          title={strings.remove()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          sx={{
            ml: 1,
            ":hover": { bg: "background-error" },
            ":hover path": { fill: "var(--icon-error) !important" }
          }}
        />
      )}
    </Flex>
  );
}
export default IconTag;
