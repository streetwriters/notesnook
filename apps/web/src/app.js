import React, { useState, Suspense, useMemo, useRef, useEffect } from "react";
import { Box, Flex } from "rebass";
import ThemeProvider from "./components/theme-provider";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";
import { LazyMotion, domAnimation } from "framer-motion";
import useDatabase from "./hooks/use-database";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Config from "./utils/config";
import { useStore } from "./stores/app-store";
import { Toaster } from "react-hot-toast";
import { ViewLoader } from "./components/loaders/view-loader";
import { NavigationLoader } from "./components/loaders/navigation-loader";
import { StatusBarLoader } from "./components/loaders/status-bar-loader";
import { EditorLoader } from "./components/loaders/editor-loader";

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
  const isMobile = useMobile();
  const [show, setShow] = useState(true);
  const [isAppLoaded] = useDatabase();

  return (
    <LazyMotion features={domAnimation} strict>
      <ThemeProvider>
        {isAppLoaded && (
          <Suspense fallback={<div style={{ display: "none" }} />}>
            <div id="menu-wrapper">
              <GlobalMenuWrapper />
            </div>
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
          {isMobile ? (
            <MobileAppContents isAppLoaded={isAppLoaded} />
          ) : (
            <DesktopAppContents
              isAppLoaded={isAppLoaded}
              setShow={setShow}
              show={show}
            />
          )}
          <Toaster />
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

function DesktopAppContents({ isAppLoaded, show, setShow }) {
  const isFocusMode = useStore((store) => store.isFocusMode);
  const isTablet = useTablet();
  const defaultSizes = useMemo(
    () => [isTablet ? 60 : 180, isTablet ? 240 : 380],
    [isTablet]
  );
  const paneSizes = useMemo(
    () => Config.get("paneSizes", defaultSizes),
    [defaultSizes]
  );
  const [isNarrow, setIsNarrow] = useState(isTablet);
  const panesRef = useRef();

  useEffect(() => {
    setIsNarrow(isTablet);
  }, [isTablet]);

  return (
    <>
      <Flex
        variant="rowFill"
        sx={{
          overflow: "hidden"
        }}
      >
        <Allotment
          ref={panesRef}
          proportionalLayout
          onChange={(sizes) => {
            Config.set("paneSizes", sizes);
            setIsNarrow(sizes[0] <= 132);
          }}
        >
          <Allotment.Pane
            className="pane nav-pane"
            minSize={50}
            preferredSize={isTablet ? 50 : paneSizes[0]}
            visible={!isFocusMode}
          >
            <Flex sx={{ overflow: "hidden", flex: 1 }}>
              <SuspenseLoader
                condition={isAppLoaded}
                component={NavigationMenu}
                props={{
                  toggleNavigationContainer: (state) => {
                    setShow(state || !show);
                  },
                  isTablet: isNarrow
                }}
                fallback={<NavigationLoader />}
              />
            </Flex>
          </Allotment.Pane>
          <Allotment.Pane
            className="pane middle-pane"
            minSize={2}
            preferredSize={paneSizes[1]}
            visible={show}
          >
            <Flex className="listMenu" variant="columnFill">
              <SuspenseLoader
                condition={isAppLoaded}
                component={CachedRouter}
                fallback={<ViewLoader />}
              />
            </Flex>
          </Allotment.Pane>

          <Allotment.Pane className="pane editor-pane">
            <Flex
              sx={{
                overflow: "hidden",
                flex: 1
              }}
              flexDirection="column"
            >
              <SuspenseLoader
                fallback={<EditorLoader />}
                component={HashRouter}
                condition={isAppLoaded}
              />
            </Flex>
          </Allotment.Pane>
        </Allotment>
      </Flex>

      <SuspenseLoader
        fallback={<StatusBarLoader />}
        component={StatusBar}
        condition={isAppLoaded}
      />
    </>
  );
}

function MobileAppContents({ isAppLoaded }) {
  return (
    <Flex
      id="slider"
      variant="rowFill"
      overflowX={"auto"}
      sx={{
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
        scrollSnapStop: "always",
        overscrollBehavior: "contain"
      }}
    >
      <Flex
        flexShrink={0}
        sx={{
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          width: [300, 60]
        }}
      >
        <SuspenseLoader
          condition={isAppLoaded}
          component={NavigationMenu}
          props={{
            toggleNavigationContainer: () => {}
          }}
          fallback={<NavigationLoader />}
        />
      </Flex>
      <Flex
        className="listMenu"
        variant="columnFill"
        width={"100vw"}
        sx={{
          position: "relative",
          scrollSnapAlign: "start",
          scrollSnapStop: "always"
        }}
        flexShrink={0}
      >
        <SuspenseLoader
          condition={isAppLoaded}
          component={CachedRouter}
          fallback={<ViewLoader />}
        />
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
            pointerEvents: "none"
          }}
          bg="black"
        />
      </Flex>
      <Flex
        width={"100vw"}
        flexShrink={0}
        sx={{
          scrollSnapAlign: "start",
          scrollSnapStop: "always"
        }}
        flexDirection="column"
      >
        <SuspenseLoader
          fallback={<EditorLoader />}
          component={HashRouter}
          condition={isAppLoaded}
        />
      </Flex>
    </Flex>
  );
}
