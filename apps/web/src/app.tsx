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

import React, { useState, Suspense, useEffect } from "react";
import { Box, Flex } from "@theme-ui/components";
import { ScopedThemeProvider } from "./components/theme-provider";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";
import { useStore } from "./stores/app-store";
import { Toaster } from "react-hot-toast";
import NavigationMenu from "./components/navigation-menu";
import StatusBar from "./components/status-bar";
import { FlexScrollContainer } from "./components/scroll-container";
import CachedRouter from "./components/cached-router";
import { WebExtensionRelay } from "./utils/web-extension-relay";
import { Pane, SplitPane } from "./components/split-pane";
import GlobalMenuWrapper from "./components/global-menu-wrapper";
import AppEffects from "./app-effects";
import HashRouter from "./components/hash-router";
import { useWindowFocus } from "./hooks/use-window-focus";
import { Global } from "@emotion/react";

new WebExtensionRelay();

const MobileAppEffects = React.lazy(() => import("./app-effects.mobile"));

function App() {
  const isMobile = useMobile();
  const [show, setShow] = useState(true);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const { isFocused } = useWindowFocus();
  console.timeEnd("loading app");

  return (
    <>
      {isFocused ? null : (
        <Global
          styles={`
          body {
            filter:  brightness(0.95) grayscale(1);
          }
          .titlebar {
            background: var(--background-secondary) !important;
          }
        `}
        />
      )}
      <Suspense fallback={<div style={{ display: "none" }} />}>
        <div id="menu-wrapper">
          <GlobalMenuWrapper />
        </div>
        {isMobile && (
          <MobileAppEffects
            sliderId="slider"
            overlayId="overlay"
            setShow={setShow}
          />
        )}
      </Suspense>
      <AppEffects setShow={setShow} />

      <Flex
        id="app"
        bg="background"
        className={isFocusMode ? "app-focus-mode" : ""}
        sx={{
          overflow: "hidden",
          flexDirection: "column",
          height: "100%"
        }}
      >
        {isMobile ? (
          <MobileAppContents />
        ) : (
          <DesktopAppContents setShow={setShow} show={show} />
        )}
        <Toaster containerClassName="toasts-container" />
      </Flex>
    </>
  );
}

export default App;

type DesktopAppContentsProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};
function DesktopAppContents({ show, setShow }: DesktopAppContentsProps) {
  const isFocusMode = useStore((store) => store.isFocusMode);
  const isTablet = useTablet();
  const [isNarrow, setIsNarrow] = useState(isTablet || false);
  // const navPane = useRef<ImperativePanelHandle>(null);
  // const middlePane = useRef<ImperativePanelHandle>(null);

  // useEffect(() => {
  //   const size = navPane.current?.getSize();
  //   // Toggle `isNarrow` to true if panel size isn't set to narrow by user
  //   setIsNarrow((size && size <= 5) || isTablet);
  // }, [isTablet]);

  // useEffect(() => {
  //   if (show) middlePane.current?.expand();
  //   else middlePane.current?.collapse();
  // }, [show]);

  // useEffect(() => {
  //   if (isFocusMode) {
  //     const middlePaneSize = middlePane.current?.getSize() || 20;
  //     navPane.current?.collapse();
  //     // the middle pane has to be resized because collapsing the nav
  //     // pane increases the middle pane's size every time.
  //     middlePane.current?.resize(middlePaneSize);
  //   } else navPane.current?.expand();
  // }, [isFocusMode]);
  return (
    <>
      <Flex
        variant="rowFill"
        sx={{
          overflow: "hidden"
        }}
      >
        <SplitPane
          autoSaveId="global-panel-group"
          direction="vertical"
          initialSizes={[isTablet ? 60 : 180, isTablet ? 240 : 380]}
          onChange={(sizes) => {
            setIsNarrow(sizes[0] <= 70);
          }}
        >
          {!isFocusMode && isTablet ? (
            <Flex sx={{ width: 50 }}>
              <NavigationMenu
                toggleNavigationContainer={(state) => {
                  setShow(state || !show);
                }}
                isTablet={isNarrow}
              />
            </Flex>
          ) : (
            !isFocusMode && (
              <Pane minSize={50} snapSize={120} maxSize={300}>
                <NavigationMenu
                  toggleNavigationContainer={(state) => {
                    setShow(state || !show);
                  }}
                  isTablet={isNarrow}
                />
              </Pane>
            )
          )}
          {!isFocusMode && show && (
            <Pane
              style={{ flex: 1, display: "flex" }}
              snapSize={200}
              maxSize={500}
            >
              <ScopedThemeProvider
                className="listMenu"
                scope="list"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  bg: "background",
                  borderRight: "1px solid var(--separator)"
                }}
              >
                <CachedRouter />
              </ScopedThemeProvider>
            </Pane>
          )}

          <Pane
            style={{
              flex: 1,
              display: "flex",
              backgroundColor: "var(--background)",
              overflow: "hidden",
              flexDirection: "column"
            }}
          >
            {<HashRouter />}
          </Pane>
        </SplitPane>
      </Flex>
      <StatusBar />
    </>
  );
}

function MobileAppContents() {
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
        <NavigationMenu toggleNavigationContainer={() => { }} isTablet={false} />
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
        <CachedRouter />
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
        <HashRouter />
      </Flex>
    </FlexScrollContainer>
  );
}
