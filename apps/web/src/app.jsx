/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

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

import React, { useState, Suspense, useRef } from "react";
import { Box, Flex } from "@theme-ui/components";
import ThemeProvider from "./components/theme-provider";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";
import { LazyMotion, domAnimation } from "framer-motion";
import useDatabase from "./hooks/use-database";
import { Allotment, LayoutPriority } from "allotment";
import { useStore } from "./stores/app-store";
import { Toaster } from "react-hot-toast";
import { ViewLoader } from "./components/loaders/view-loader";
import NavigationMenu from "./components/navigation-menu";
import StatusBar from "./components/status-bar";
import { EditorLoader } from "./components/loaders/editor-loader";
import { FlexScrollContainer } from "./components/scroll-container";
import CachedRouter from "./components/cached-router";
import { WebExtensionRelay } from "./utils/web-extension-relay";
import { usePersistentState } from "./hooks/use-persistent-state";

new WebExtensionRelay();

const GlobalMenuWrapper = React.lazy(() =>
  import("./components/global-menu-wrapper")
);
const AppEffects = React.lazy(() => import("./app-effects"));
const MobileAppEffects = React.lazy(() => import("./app-effects.mobile"));
const HashRouter = React.lazy(() => import("./components/hash-router"));

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
          id="app"
          bg="background"
          sx={{ overflow: "hidden", flexDirection: "column", height: "100%" }}
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
          <Toaster containerClassName="toasts-container" />
        </Flex>
      </ThemeProvider>
    </LazyMotion>
  );
}

export default App;

function SuspenseLoader({ condition, props, component: Component, fallback }) {
  if (!condition) return fallback;

  return (
    <Suspense
      fallback={
        import.meta.env.REACT_APP_PLATFORM === "desktop" ? null : fallback
      }
    >
      <Component {...props} />
    </Suspense>
  );
}

function DesktopAppContents({ isAppLoaded, show, setShow }) {
  const isFocusMode = useStore((store) => store.isFocusMode);
  const isTablet = useTablet();
  const [paneSizes, setPaneSizes] = usePersistentState("paneSizes", [
    isTablet ? 60 : 180,
    isTablet ? 240 : 380
  ]);
  const panesRef = useRef();
  const [isNarrow, setIsNarrow] = useState(paneSizes[0] <= 55);

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
          proportionalLayout={false}
          onDragEnd={(sizes) => {
            setPaneSizes(sizes);
            setIsNarrow(sizes[0] <= 55);
          }}
        >
          <Allotment.Pane
            className="pane nav-pane"
            minSize={50}
            preferredSize={isTablet ? 50 : paneSizes[0]}
            visible={!isFocusMode}
            priority={LayoutPriority.Low}
          >
            <NavigationMenu
              toggleNavigationContainer={(state) => {
                setShow(state || !show);
              }}
              isTablet={isNarrow}
            />
          </Allotment.Pane>
          <Allotment.Pane
            className="pane middle-pane"
            minSize={2}
            preferredSize={paneSizes[1]}
            visible={show}
            priority={LayoutPriority.Normal}
          >
            <Flex className="listMenu" variant="columnFill">
              {isAppLoaded && <CachedRouter />}
            </Flex>
          </Allotment.Pane>
          <Allotment.Pane
            className="pane editor-pane"
            priority={LayoutPriority.High}
          >
            <Flex
              sx={{
                overflow: "hidden",
                flex: 1,
                flexDirection: "column"
              }}
            >
              {isAppLoaded && (
                <SuspenseLoader
                  fallback={<EditorLoader />}
                  component={HashRouter}
                  condition={isAppLoaded}
                />
              )}
            </Flex>
          </Allotment.Pane>
        </Allotment>
      </Flex>

      <StatusBar />
    </>
  );
}

function MobileAppContents({ isAppLoaded }) {
  return (
    <FlexScrollContainer
      id="slider"
      suppressScrollX
      style={{
        display: "flex",
        flexDirection: "row",
        overflowY: "hidden",
        scrollSnapType: "x mandatory",
        scrollBehavior: "smooth",
        WebkitOverflowScrolling: "touch",
        scrollSnapStop: "always",
        overscrollBehavior: "contain",
        overflowX: "auto",
        flex: 1
      }}
    >
      <Flex
        sx={{
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          width: [300, 60],
          flexShrink: 0
        }}
      >
        <NavigationMenu toggleNavigationContainer={() => {}} isTablet={false} />
      </Flex>
      <Flex
        className="listMenu"
        variant="columnFill"
        sx={{
          position: "relative",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          flexShrink: 0,
          width: "100vw"
        }}
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
        sx={{
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          flexDirection: "column",
          flexShrink: 0,
          width: "100vw"
        }}
      >
        <SuspenseLoader
          fallback={<EditorLoader />}
          component={HashRouter}
          condition={isAppLoaded}
        />
      </Flex>
    </FlexScrollContainer>
  );
}
