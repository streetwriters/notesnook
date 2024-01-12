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

import React, { PropsWithChildren, useLayoutEffect } from "react";
import { MacScrollbar, MacScrollbarProps } from "mac-scrollbar";
import "mac-scrollbar/dist/mac-scrollbar.css";

type ScrollContainerProps = {
  style?: React.CSSProperties;
  forwardedRef?: (ref: HTMLDivElement | null) => void;
};

const ScrollContainer = ({
  children,
  forwardedRef,
  ...props
}: PropsWithChildren<ScrollContainerProps>) => {
  return (
    <MacScrollbar
      {...props}
      ref={(div) => {
        forwardedRef && forwardedRef(div as HTMLDivElement);
      }}
      style={{
        position: "relative",
        height: "100%"
      }}
      suppressScrollX
      minThumbSize={40}
    >
      {children}
    </MacScrollbar>
  );
};
export default ScrollContainer;

type FlexScrollContainerProps = {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  scrollRef?: React.Ref<HTMLElement>;
} & MacScrollbarProps;

export function FlexScrollContainer({
  id,
  children,
  style,
  className,
  scrollRef,
  ...restProps
}: PropsWithChildren<FlexScrollContainerProps>) {
  return (
    <MacScrollbar
      {...restProps}
      ref={scrollRef}
      id={id}
      className={className}
      style={style}
      minThumbSize={40}
    >
      {children}
    </MacScrollbar>
  );
}
