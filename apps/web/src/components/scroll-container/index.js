import React from "react";
import RSC from "react-scrollbars-custom";

const ScrollContainer = ({
  children,
  forwardedRef,
  onScroll,
  style,
  className,
}) => {
  return (
    <RSC
      className={className}
      style={style}
      trackClickBehavior="step"
      onMouseEnter={() => {
        const scrollTrackY = document.querySelector(".scrollTrackY");
        if (scrollTrackY) scrollTrackY.style.opacity = 1;
      }}
      onMouseLeave={(e) => {
        if (e.nativeEvent.buttons > 0) return;
        const scrollTrackY = document.querySelector(".scrollTrackY");
        if (scrollTrackY) scrollTrackY.style.opacity = 0;
      }}
      wrapperProps={{
        style: { right: 0, inset: "0px 0px 0px 0px" },
      }}
      trackYProps={{
        className: "scrollTrackY",
        style: {
          height: "100%",
          width: 8,
          top: 0,
          opacity: 0,
          transition: "opacity 150ms linear",
        },
      }}
      scrollerProps={{
        renderer: (props) => {
          const { elementRef, onScroll: rscOnScroll, ...restProps } = props;

          return (
            <span
              {...restProps}
              onScroll={(e) => {
                if (onScroll) onScroll(e);
                rscOnScroll(e);
              }}
              ref={(ref) => {
                if (forwardedRef) forwardedRef(ref);
                elementRef(ref);
              }}
            />
          );
        },
      }}
    >
      {children}
    </RSC>
  );
};
export default ScrollContainer;
