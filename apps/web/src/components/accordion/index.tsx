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
import { PropsWithChildren, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "../icons";
import { ThemeVariant } from "../theme-provider";

export type AccordionProps = {
  title: string;
  isClosed: boolean;
  color?: SchemeColors;
  testId?: string;
};

export default function Accordion(
  props: PropsWithChildren<AccordionProps> & FlexProps
) {
  const { isClosed, title, color, children, testId, sx, ...restProps } = props;
  const [isContentHidden, setIsContentHidden] = useState(false);

  useEffect(() => {
    setIsContentHidden(isClosed);
  }, [isClosed]);

  return (
    <Flex sx={{ flexDirection: "column", ...sx }} {...restProps}>
      <ThemeVariant variant="secondary">
        <Flex
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            bg: "background",
            p: 1,
            borderRadius: "default"
          }}
          onClick={() => {
            setIsContentHidden((state) => !state);
          }}
          data-test-id={testId}
        >
          <Text variant="subtitle" sx={{ color }}>
            {title}
          </Text>
          {isContentHidden ? (
            <ChevronDown size={16} color={color} />
          ) : (
            <ChevronUp size={16} color={color} />
          )}
        </Flex>
      </ThemeVariant>
      {!isContentHidden && children}
    </Flex>
  );
}
