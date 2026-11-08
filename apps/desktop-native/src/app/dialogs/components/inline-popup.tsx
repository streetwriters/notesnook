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

import type { ReactNode, RefObject } from "react";
import { Popover, type SxProp, type UIElement } from "@ui";

export function InlinePopup(props: {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<UIElement | null>;
  sx?: SxProp;
  children?: ReactNode;
}) {
  return (
    <Popover
      isOpen={props.isOpen}
      onClose={props.onClose}
      anchorRef={props.anchorRef}
      placement="bottom-start"
      sx={{
        bg: "background",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius2",
        boxShadow: "menu",
        ...props.sx
      }}
    >
      {props.children}
    </Popover>
  );
}
