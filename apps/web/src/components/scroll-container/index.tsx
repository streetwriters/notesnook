/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import React, { PropsWithChildren, useRef } from "react";
import { Box } from "@theme-ui/components";
import { Scrollbars } from "rc-scrollbars";

type ScrollContainerProps = {
  style?: React.CSSProperties;
  forwardedRef?: (ref: HTMLDivElement | null) => void;
};

const ScrollContainer = ({
  children,
  style,
  forwardedRef,
  ...props
}: PropsWithChildren<ScrollContainerProps>) => {
  const ref = useRef<Scrollbars>();

  return (
    <Scrollbars
      {...props}
      autoHide
      ref={(sRef) => {
        if (!sRef) return;
        forwardedRef && forwardedRef((sRef.view as HTMLDivElement) || null);
        ref.current = sRef;
      }}
      style={{ ...style, overflowY: "hidden" }}
      renderView={({ style, ...props }) => (
        <Box
          {...props}
          style={{ ...style, inset: "-1px" }}
          onMouseEnter={() => {
            if (
              !ref.current ||
              !ref.current.thumbVertical ||
              !ref.current.thumbHorizontal
            )
              return;
            const {
              thumbHorizontal,
              thumbVertical,
              getThumbHorizontalWidth,
              getThumbVerticalHeight
            } = ref.current;

            const height = `${getThumbVerticalHeight()}px`;
            const width = `${getThumbHorizontalWidth()}px`;
            if (height !== thumbVertical.style.height)
              thumbVertical.style.height = height;
            else if (thumbHorizontal.style.width !== width)
              thumbHorizontal.style.width = width;
          }}
        />
      )}
      renderThumbVertical={({ style, ...props }) => (
        <Box
          {...props}
          style={{
            ...style,
            backgroundColor: "var(--bgSecondaryText)"
          }}
        />
      )}
    >
      {children}
    </Scrollbars>
  );
};
export default ScrollContainer;

type FlexScrollContainerProps = {
  className?: string;
  style?: React.CSSProperties;
  viewStyle?: React.CSSProperties;
};

export function FlexScrollContainer({
  children,
  className,
  style,
  viewStyle
}: PropsWithChildren<FlexScrollContainerProps>) {
  return (
    <Scrollbars
      autoHide
      style={{
        overflowY: "hidden",
        height: "auto",
        width: "auto",
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        ...style
      }}
      renderView={({ style: _style, ...props }) => (
        <Box
          {...props}
          className={className}
          style={{
            overflow: "scroll",
            position: "relative",
            flex: "1 1 auto",
            ...viewStyle
          }}
          sx={{
            scrollbarWidth: "none",
            "::-webkit-scrollbar": { width: 0, height: 0 },
            msOverflowStyle: "none"
          }}
        />
      )}
      renderThumbVertical={({ style, ...props }) => (
        <Box
          {...props}
          style={{
            ...style,
            backgroundColor: "var(--bgSecondaryText)"
          }}
        />
      )}
    >
      {children}
    </Scrollbars>
  );
}
