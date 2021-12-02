import React, { useState, Suspense } from "react";
import { Box, Flex } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { AnimatedFlex } from "./components/animated";
import NavigationMenuPlaceholder from "./components/navigationmenu/index.lite";
import StatusBarPlaceholder from "./components/statusbar/index.lite";
import useMobile from "./utils/use-mobile";
import useTablet from "./utils/use-tablet";
import { LazyMotion, domAnimation } from "framer-motion";
import useDatabase from "./hooks/use-database";
import Loader from "./components/loader";

const GlobalMenuWrapper = React.lazy(() =>
  import("./components/global-menu-wrapper")
);
const AppEffects = React.lazy(() => import("./app-effects"));
const MobileAppEffects = React.lazy(() => import("./app-effects.mobile"));
const CachedRouter = React.lazy(() => import("./components/cached-router"));
const HashRouter = React.lazy(() => import("./components/hash-router"));
const NavigationMenu = React.lazy(() => import("./components/navigation-menu"));
const StatusBar = React.lazy(() => import("./components/status-bar"));

function App() {
  const [show, setShow] = useState(true);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const [isAppLoaded] = useDatabase();

  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider>
        {isAppLoaded && (
          <Suspense fallback={<div style={{ display: "none" }} />}>
            <GlobalMenuWrapper />
            <AppEffects setShow={setShow} />
            {isMobile && (
              <MobileAppEffects
                sliderId="slider"
                overlayId="overlay"
                setShow={setShow}
              />
            )}
          </Suspense>
        )}
        <Flex
          flexDirection="column"
          id="app"
          bg="background"
          height="100%"
          sx={{ overflow: "hidden" }}
        >
          <Flex
            id="slider"
            variant="rowFill"
            overflowX={["auto", "hidden"]}
            sx={{
              overflowY: "hidden",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              scrollSnapStop: "always",
              overscrollBehavior: "contain",
            }}
          >
            <Flex
              flexShrink={0}
              sx={{
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              <SuspenseLoader
                condition={isAppLoaded}
                component={NavigationMenu}
                props={{
                  toggleNavigationContainer: (state) => {
                    if (!isMobile) setShow(state || !show);
                  },
                }}
                fallback={<NavigationMenuPlaceholder />}
              />
            </Flex>
            <AnimatedFlex
              className="listMenu"
              variant="columnFill"
              initial={{
                width: isMobile ? "100vw" : isTablet ? "40%" : "25%",
                opacity: 1,
                x: 0,
              }}
              animate={{
                width: show
                  ? isMobile
                    ? "100vw"
                    : isTablet
                    ? "40%"
                    : "25%"
                  : "0%",
                x: show ? 0 : isTablet ? "-40%" : "-25%",
                opacity: show ? 1 : 0,
              }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              sx={{
                borderRight: "1px solid",
                borderColor: "border",
                borderRightWidth: show ? 1 : 0,
                position: "relative",
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
              flexShrink={0}
            >
              <SuspenseLoader
                condition={isAppLoaded}
                component={CachedRouter}
                fallback={
                  <Loader
                    title="Did you know?"
                    text="All your notes are encrypted on your device."
                  />
                }
              />
              {isMobile && (
                <Box
                  id="overlay"
                  sx={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    top: 0,
                    left: 0,
                    zIndex: 999,
                    opacity: 0,
                    visibility: "visible",
                    pointerEvents: "none",
                  }}
                  bg="black"
                />
              )}
            </AnimatedFlex>
            <Flex
              width={["100vw", "100%"]}
              flexShrink={[0, 1]}
              sx={{
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
              flexDirection="column"
            >
              <SuspenseLoader
                fallback={
                  <Loader
                    title="Fun fact"
                    text="Notesnook was released in January 2021 by a team of only 3 people."
                  />
                }
                component={HashRouter}
                condition={isAppLoaded}
              />
            </Flex>
          </Flex>
          <SuspenseLoader
            fallback={<StatusBarPlaceholder />}
            component={StatusBar}
            condition={isAppLoaded}
          />
        </Flex>
      </ThemeProvider>
    </LazyMotion>
  );
}

export default App;

function SuspenseLoader({ condition, props, component: Component, fallback }) {
  if (!condition) return fallback;

  return (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}
