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

import { Flex, FlexProps, Text, TextProps } from "@theme-ui/components";
import { KeyboardEvent, PropsWithChildren, ReactNode } from "react";
import { CheckSvgIcon } from "../icons";

export function SettingsCard(props: PropsWithChildren<FlexProps>) {
  const { children, sx, ...rest } = props;
  return (
    <Flex
      {...rest}
      sx={{
        flexDirection: "column",
        gap: "spacing4",
        px: "spacing5",
        py: "spacing6",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius2",
        ...sx
      }}
    >
      {children}
    </Flex>
  );
}

export function CardTitle(props: { title: string; children?: ReactNode }) {
  return (
    <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
      <Text
        sx={{
          fontSize: "sm",
          fontWeight: 500,
          lineHeight: 1,
          color: "heading"
        }}
      >
        {props.title}
      </Text>
      {props.children ? (
        <Text
          as="div"
          sx={{
            fontSize: "xs",
            lineHeight: 1.2,
            color: "paragraph",
            "& a": { color: "accent", textDecoration: "underline" }
          }}
        >
          {props.children}
        </Text>
      ) : null}
    </Flex>
  );
}

export function IconBox(props: PropsWithChildren<FlexProps>) {
  const { children, sx, ...rest } = props;
  return (
    <Flex
      {...rest}
      sx={{
        width: 30,
        height: 30,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        bg: "background-secondary",
        borderRadius: "radius1",
        ...sx
      }}
    >
      {children}
    </Flex>
  );
}

export function StatusPill(props: { label: string }) {
  return (
    <Flex
      sx={{
        alignItems: "center",
        gap: "spacing1",
        bg: "accent",
        px: "spacing2",
        py: "3px",
        borderRadius: "radius4"
      }}
    >
      <CheckSvgIcon size={10} color="accentForeground" />
      <Text
        sx={{
          fontSize: "3xs",
          fontWeight: 500,
          lineHeight: 1,
          color: "accentForeground"
        }}
      >
        {props.label}
      </Text>
    </Flex>
  );
}

export function SectionHeading(props: TextProps) {
  const { sx, ...rest } = props;
  return (
    <Text
      variant="subBody"
      {...rest}
      sx={{
        fontSize: "xs",
        fontWeight: 600,
        lineHeight: 1,
        color: "accent",
        ...sx
      }}
    />
  );
}

/**
 * Props that make a non-button element behave like a button: focusable, and
 * activated by click, Enter or Space. Returns no props when `onActivate` is
 * missing or `disabled` is set (the element is then not interactive).
 */
export function buttonProps(onActivate?: () => void, disabled?: boolean) {
  if (!onActivate) return {};
  if (disabled) return { role: "button", tabIndex: -1, "aria-disabled": true };
  return {
    role: "button",
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate();
      }
    }
  };
}
