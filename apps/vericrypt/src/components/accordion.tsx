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
import { Flex, FlexProps, Text } from "@theme-ui/components";
import { PropsWithChildren, useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

type AccordionProps = FlexProps & {
  title: string;
  color?: string;
};
export function Accordion({
  title,
  children,
  sx,
  color = "icon",
  ...restProps
}: PropsWithChildren<AccordionProps>) {
  const [isContentHidden, setIsContentHidden] = useState<boolean>(true);
  return (
    <Flex sx={{ flexDirection: "column", ...sx }} {...restProps}>
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          cursor: "pointer",
          color: color
        }}
        onClick={() => {
          setIsContentHidden((state) => !state);
        }}
      >
        <Text variant="subtitle" sx={{ color }}>
          {title}
        </Text>
        {isContentHidden ? (
          <IoChevronDown size={16} color={color} />
        ) : (
          <IoChevronUp size={16} color={color} />
        )}
      </Flex>
      {!isContentHidden && children}
    </Flex>
  );
}
