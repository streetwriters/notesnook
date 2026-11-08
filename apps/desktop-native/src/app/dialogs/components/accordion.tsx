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
import { Flex, Text, type SxProp } from "@ui";
import { CaretDown, CaretRight } from "../../components/icons";

export function Accordion(props: {
  title: string;
  isClosed?: boolean;
  sx?: SxProp;
  children?: ReactNode;
}) {
  const [closed, setClosed] = useState(!!props.isClosed);
  return (
    <Flex sx={{ flexDirection: "column", ...props.sx }}>
      <Flex
        onPress={() => setClosed((c) => !c)}
        sx={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1
        }}
      >
        <Text variant="subtitle">{props.title}</Text>
        {closed ? <CaretRight size={16} /> : <CaretDown size={16} />}
      </Flex>
      {closed ? null : props.children}
    </Flex>
  );
}
