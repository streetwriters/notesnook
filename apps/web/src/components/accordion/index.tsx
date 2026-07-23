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

import { SchemeColors } from "@notesnook/theme";
import { Flex, FlexProps, Text } from "@theme-ui/components";
import { PropsWithChildren, useState } from "react";
import { CaretDown, ChevronDown, ChevronUp } from "../icons";

export type AccordionProps = {
  title: string;
  isClosed: boolean;
  color?: SchemeColors;
  testId?: string;
  buttonSx?: FlexProps["sx"];
  titleSx?: FlexProps["sx"];
  containerSx?: FlexProps["sx"];
  variant?: "default" | "faq";
};

export default function Accordion(
  props: PropsWithChildren<AccordionProps> & FlexProps
) {
  const {
    isClosed,
    title,
    color,
    children,
    testId,
    sx,
    containerSx,
    variant,
    ...restProps
  } = props;
  const [isContentHidden, setIsContentHidden] = useState(isClosed);
  const isFaqVariant = variant === "faq";

  if (isFaqVariant) {
    return (
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing4",
          p: "spacing6",
          borderRadius: "radius2",
          border: isContentHidden
            ? "1px solid var(--border)"
            : "1px solid var(--background-selected)",
          bg: isContentHidden ? undefined : "background-selected",
          ...sx
        }}
        {...restProps}
      >
        <Flex
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            ...props.buttonSx
          }}
          onClick={() => setIsContentHidden((s) => !s)}
          data-test-id={testId}
        >
          <Text variant="subtitle" sx={{ color, ...props.titleSx }}>
            {title}
          </Text>
          <CaretDown size={20} />
        </Flex>
        {!isContentHidden && (
          <Flex sx={{ flexDirection: "column", ...containerSx }}>
            {children}
          </Flex>
        )}
      </Flex>
    );
  }

  return (
    <Flex sx={{ flexDirection: "column", ...sx }} {...restProps}>
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          bg: "var(--background-secondary)",
          p: 1,
          borderRadius: "default",
          ...props.buttonSx
        }}
        onClick={() => {
          setIsContentHidden((state) => !state);
        }}
        data-test-id={testId}
      >
        <Text variant="subtitle" sx={{ color, ...props.titleSx }}>
          {title}
        </Text>
        {isContentHidden ? (
          <ChevronDown size={16} color={color} />
        ) : (
          <ChevronUp size={16} color={color} />
        )}
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          ...containerSx,
          display: isContentHidden ? "none" : "flex"
        }}
      >
        {children}
      </Flex>
    </Flex>
  );
}
