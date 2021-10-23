import { useAnimation } from "framer-motion";
import React, { useEffect } from "react";
import { Flex } from "rebass";
import { AnimatedBox } from "../animated";

function ProgressBar(props) {
  const { width, progress, duration = 1, onLoadingEnd, sx } = props;
  const animation = useAnimation();
  useEffect(() => {
    animation.start({ width: `${progress}%`, transition: { duration } });
  }, [animation, progress, duration]);

  return (
    <Flex overflow="hidden" width={width} sx={sx}>
      <AnimatedBox
        height={5}
        initial={{ width: "0%" }}
        animate={animation}
        bg="primary"
        sx={{ borderRadius: "default" }}
        onAnimationComplete={onLoadingEnd}
      />
    </Flex>
  );
}

export default ProgressBar;
