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
import { Flex, type SxProp } from "@ui";

export function InlinePopup(props: {
  isOpen: boolean;
  sx?: SxProp;
  children?: ReactNode;
}) {
  if (!props.isOpen) return null;
  return (
    <Flex
      sx={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 100,
        mt: "10px",
        bg: "background",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius2",
        boxShadow: "menu",
        ...props.sx
      }}
    >
      {props.children}
    </Flex>
  );
}
