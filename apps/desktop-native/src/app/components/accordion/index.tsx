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

import { useState, type ReactNode } from "react";
import { Flex, Text, type ColorValue, type SxProp } from "@ui";
import { CaretDown, ChevronDown, ChevronUp } from "../icons";

export type AccordionProps = {
  title: string;
  isClosed: boolean;
  color?: ColorValue;
  testId?: string;
  buttonSx?: SxProp;
  titleSx?: SxProp;
  containerSx?: SxProp;
  variant?: "default" | "faq";
  sx?: SxProp;
  children?: ReactNode;
};

export default function Accordion(props: AccordionProps) {
  const { isClosed, title, color, children, testId, sx, containerSx, variant } =
    props;
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
          border: "1px solid",
          borderColor: isContentHidden ? "border" : "background-selected",
          bg: isContentHidden ? undefined : "background-selected",
          ...sx
        }}
      >
        <Flex
          testID={testId}
          onPress={() => setIsContentHidden((s) => !s)}
          sx={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            ...props.buttonSx
          }}
        >
          <Text variant="subtitle" sx={{ color, ...props.titleSx }}>
            {title}
          </Text>
          <CaretDown size={20} color="icon" />
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
    <Flex sx={{ flexDirection: "column", ...sx }}>
      <Flex
        testID={testId}
        onPress={() => setIsContentHidden((state) => !state)}
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          bg: "background-secondary",
          p: 1,
          borderRadius: "default",
          ...props.buttonSx
        }}
      >
        <Text variant="subtitle" sx={{ color, ...props.titleSx }}>
          {title}
        </Text>
        {isContentHidden ? (
          <ChevronDown size={16} color={color || "icon"} />
        ) : (
          <ChevronUp size={16} color={color || "icon"} />
        )}
      </Flex>
      {isContentHidden ? null : (
        <Flex sx={{ flexDirection: "column", ...containerSx }}>{children}</Flex>
      )}
    </Flex>
  );
}
