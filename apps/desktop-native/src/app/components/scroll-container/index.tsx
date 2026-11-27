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

import {
  ScrollContainer as UIScrollContainer,
  type SxProp
} from "@notesnook/ui-kit";
import type { ReactNode } from "react";

export type ScrollContainerProps = {
  sx?: SxProp;
  "data-test-id"?: string;
  children?: ReactNode;
};

const ScrollContainer = (props: ScrollContainerProps) => {
  const { children, sx } = props;
  return (
    <UIScrollContainer
      data-test-id={props["data-test-id"]}
      sx={{ height: "100%", ...sx }}
    >
      {children}
    </UIScrollContainer>
  );
};
export default ScrollContainer;

export function FlexScrollContainer(props: ScrollContainerProps) {
  const { children, sx } = props;
  return (
    <UIScrollContainer data-test-id={props["data-test-id"]} sx={sx}>
      {children}
    </UIScrollContainer>
  );
}
