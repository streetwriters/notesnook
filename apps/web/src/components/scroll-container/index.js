import React, { useRef } from "react";
import { Box } from "rebass";
import { Scrollbars } from "rc-scrollbars";
import "./style.css";

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
            backgroundColor: "var(--bgSecondaryText)",
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
        ...style,
      }}
      renderView={({ style, ...props }) => (
        <Box
          {...props}
          className={className}
          style={{
            overflow: "auto",
            position: "relative",
            flex: "1 1 auto",
            ...viewStyle,
          }}
          sx={{
            scrollbarWidth: "none",
            "::-webkit-scrollbar": { width: 0, height: 0 },
            msOverflowStyle: "none",
          }}
        />
      )}
      renderThumbVertical={({ style, ...props }) => (
        <Box
          {...props}
          style={{
            ...style,
            backgroundColor: "var(--bgSecondaryText)",
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
