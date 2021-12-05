import React from "react";
import { Box, Text } from "rebass";
import { Scrollbars } from "rc-scrollbars";

const ScrollContainer = ({ children, style, forwardedRef, ...props }) => {
  return (
    <Scrollbars
      {...props}
      autoHide
      ref={(sRef) => forwardedRef && sRef && forwardedRef(sRef.view)}
      style={{ ...style, overflowY: "hidden" }}
      renderView={({ style, ...props }) => (
        <Box {...props} style={{ ...style, inset: "-1px" }} />
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

export const CustomScrollbarsVirtualList = React.forwardRef((props, ref) => {
  return (
    <ScrollContainer {...props} forwardedRef={(sRef) => (ref.current = sRef)} />
  );
});
