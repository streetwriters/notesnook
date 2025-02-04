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

import { useState, Suspense, useEffect, useRef } from "react";
import { Box, Flex } from "@theme-ui/components";
import { ScopedThemeProvider } from "./components/theme-provider";
import useMobile from "./hooks/use-mobile";
import useTablet from "./hooks/use-tablet";
import { useStore } from "./stores/app-store";
import { useStore as useSettingStore } from "./stores/setting-store";
import { Toaster } from "react-hot-toast";
import NavigationMenu from "./components/navigation-menu";
import StatusBar from "./components/status-bar";
import { FlexScrollContainer } from "./components/scroll-container";
import CachedRouter from "./components/cached-router";
import { WebExtensionRelay } from "./utils/web-extension-relay";
import {
  Pane,
  SplitPane,
  SplitPaneImperativeHandle
} from "./components/split-pane";
import GlobalMenuWrapper from "./components/global-menu-wrapper";
import AppEffects from "./app-effects";
import HashRouter from "./components/hash-router";
import { useWindowFocus } from "./hooks/use-window-focus";
import { Global } from "@emotion/react";
import { isMac } from "./utils/platform";
import useSlider from "./hooks/use-slider";
import { AppEventManager, AppEvents } from "./common/app-events";
import { TITLE_BAR_HEIGHT } from "./components/title-bar";
import { getFontSizes } from "@notesnook/theme/theme/font/fontsize.js";
import { useWindowControls } from "./hooks/use-window-controls";

new WebExtensionRelay();

function App() {
  const isMobile = useMobile();
  const [show, setShow] = useState(true);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const { isFocused } = useWindowFocus();
  const { isFullscreen } = useWindowControls();
  const hasNativeTitlebar =
    useSettingStore.getState().desktopIntegrationSettings?.nativeTitlebar;
  console.timeEnd("loading app");

  return (
    <>
      {isFocused ? null : (
        <Global
          styles={`
          .nav-pane {
            opacity: 0.7;
          }
          .titlebar {
            background: var(--background-secondary) !important;
          }
        `}
        />
      )}
      {IS_DESKTOP_APP && isMac() && !isFullscreen && !hasNativeTitlebar ? (
        <Global
          // These styles to make sure the app content doesn't overlap with the traffic lights.
          styles={`
            .nav-pane,
            .mobile-nav-pane {
              margin-top: env(titlebar-area-height) !important;
              height: calc(100% - env(titlebar-area-height)) !important;
            }
            .nav-pane.collapsed + .list-pane .route-container-header,
            .nav-pane.collapsed + .list-pane.collapsed + .editor-pane .editor-action-bar,
            .nav-pane.collapsed + .editor-pane .editor-action-bar {
                padding-left: 25px;
            }
            .editor-pane:first-of-type .editor-action-bar,
            .mobile-editor-pane.pane-active .editor-action-bar,
            .mobile-list-pane.pane-active .route-container-header {
                padding-left: 80px;
            }
            .route-container-header, .editor-action-bar {
                transition: padding-left 0.4s ease-out;
            }
            .editor-action-bar {
              border-bottom: none;
            }
            .route-container-header .routeHeader {
              font-size: ${getFontSizes().title};
            }
            .global-split-pane .react-split__sash {
              height: calc(100% - ${TITLE_BAR_HEIGHT}px);
            }
          `}
        />
      ) : null}

      <Suspense fallback={<div style={{ display: "none" }} />}>
        <div id="menu-wrapper">
          <GlobalMenuWrapper />
        </div>
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
  const navPane = useRef<SplitPaneImperativeHandle>(null);

  useEffect(() => {
    if (isTablet) navPane.current?.collapse(0);
    else if (navPane.current?.isCollapsed(0)) navPane.current?.expand(0);
  }, [isTablet]);

  return (
    <>
      <Flex
        variant="rowFill"
        sx={{
          overflow: "hidden"
        }}
      >
        <SplitPane
          className="global-split-pane"
          ref={navPane}
          autoSaveId="global-panel-group"
          direction="vertical"
          onChange={(sizes) => {
            setIsNarrow(sizes[0] <= 70);
          }}
        >
          {isFocusMode ? null : (
            <Pane
              id="nav-pane"
              initialSize={180}
              className={`nav-pane`}
              minSize={50}
              snapSize={120}
              maxSize={300}
            >
              <NavigationMenu
                toggleNavigationContainer={(state) => {
                  setShow(state || !show);
                }}
                isTablet={isNarrow}
              />
            </Pane>
          )}
          {!isFocusMode && show ? (
            <Pane
              id="list-pane"
              initialSize={380}
              style={{ flex: 1, display: "flex" }}
              snapSize={200}
              maxSize={500}
              className="list-pane"
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
          ) : null}

          <Pane
            id="editor-pane"
            className="editor-pane"
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
  const { ref, slideToIndex } = useSlider({
    onSliding: (_e, { position }) => {
      const offset = 70;
      const width = 300;

      const percent = offset - (position / width) * offset;
      const overlay = document.getElementById("overlay");
      if (!overlay) return;
      if (percent > 0) {
        overlay.style.opacity = `${percent}%`;
        overlay.style.pointerEvents = "all";
      } else {
        overlay.style.opacity = "0%";
        overlay.style.pointerEvents = "none";
      }
    },
    onChange: (e, { slide, lastSlide }) => {
      slide.node.classList.add("pane-active");
      lastSlide?.node.classList.remove("pane-active");
    }
  });

  useEffect(() => {
    const toggleSideMenuEvent = AppEventManager.subscribe(
      AppEvents.toggleSideMenu,
      (state) => slideToIndex(state ? 0 : 1)
    );
    const toggleEditorEvent = AppEventManager.subscribe(
      AppEvents.toggleEditor,
      (state) => slideToIndex(state ? 2 : 1)
    );
    return () => {
      toggleSideMenuEvent.unsubscribe();
      toggleEditorEvent.unsubscribe();
    };
  }, [slideToIndex]);

  return (
    <FlexScrollContainer
      scrollRef={ref}
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
        className="mobile-nav-pane"
        sx={{
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          width: 300,
          flexShrink: 0
        }}
      >
        <NavigationMenu toggleNavigationContainer={() => {}} isTablet={false} />
      </Flex>
      <Flex
        className="mobile-list-pane"
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
          onClick={() => slideToIndex(1)}
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
        className="mobile-editor-pane"
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
