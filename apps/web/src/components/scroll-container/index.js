import RSC from "react-scrollbars-custom";
import { Text } from "rebass";
import "./style.css";

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
      wrapperProps={{
        style: { right: 0, inset: "0px 1px 0px 0px" },
      }}
      trackYProps={{
        className: "scrollTrackY",
        style: {
          height: "100%",
          width: 8,
          zIndex: 2,
          top: 0,
          opacity: 0,
          transition: "opacity 150ms linear",
        },
      }}
      scrollerProps={{
        renderer: (props) => {
          const {
            elementRef,
            onScroll: rscOnScroll,
            style,
            ...restProps
          } = props;

          return (
            <Text
              as="span"
              {...restProps}
              style={{
                ...style,
                marginRight: 0,
              }}
              sx={{
                scrollbarWidth: "none",
                "::-webkit-scrollbar": { width: 0, height: 0 },
                msOverflowStyle: "none",
              }}
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
