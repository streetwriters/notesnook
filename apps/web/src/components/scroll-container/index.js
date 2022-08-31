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

import React, { useRef } from "react";
import { Box } from "@theme-ui/components";
import { Scrollbars } from "rc-scrollbars";

const ScrollContainer = ({ children, style, forwardedRef, ...props }) => {
  const ref = useRef();
  return (
    <Scrollbars
      {...props}
      autoHide
      ref={(sRef) => {
        forwardedRef && sRef && forwardedRef(sRef.view);
        ref.current = sRef;
      }}
      style={{ ...style, overflowY: "hidden" }}
      renderView={({ style, ...props }) => (
        <Box
          {...props}
          style={{ ...style, inset: "-1px" }}
          onMouseEnter={() => {
            const height = ref.current.getThumbVerticalHeight();
            const width = ref.current.getThumbHorizontalWidth();
            if (height !== ref.current.thumbVertical.style.height)
              ref.current.thumbVertical.style.height = `${height}px`;
            else if (ref.current.thumbHorizontal.style.width !== width) {
              ref.current.thumbHorizontal.style.width = `${width}px`;
            }
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

export function FlexScrollContainer({
  children,
  className,
  style,
  viewStyle,
  ...props
}) {
  return (
    <Scrollbars
      {...props}
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
      renderView={({ _style, ...props }) => (
        <Box
          {...props}
          className={className}
          style={{
            overflow: "auto",
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

export const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => {
  return (
    <ScrollContainer {...props} forwardedRef={(sRef) => (ref.current = sRef)} />
  );
});
