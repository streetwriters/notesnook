import React, { useEffect } from "react";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Animated from "../animated";
import { useAnimation } from "framer-motion";

function ThemeTransition() {
  const theme = useThemeStore((store) => store.theme);
  const animate = useAnimation();
  useEffect(() => {
    if (!ThemeTransition.first) {
      ThemeTransition.first = true;
      return;
    }
    const element = document.getElementById("themeTransition");
    element.style.visibility = "visible";
    animate
      .start({
        opacity: 1,
        transition: { duration: 0 },
      })
      .then(() => {
        animate
          .start({
            opacity: 0,
            transition: { duration: 1.5 },
          })
          .then(() => {
            element.style.visibility = "collapse";
          });
      });
  }, [theme, animate]);
  return (
    <Animated.Box
      id="themeTransition"
      sx={{
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: 999,
        opacity: 1,
        visibility: "collapse",
      }}
      animate={animate}
      bg="bgSecondary"
    />
  );
}
export default ThemeTransition;
