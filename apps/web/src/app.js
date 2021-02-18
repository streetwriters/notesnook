import React, { useState, useEffect } from "react";
import "./app.css";
import { Flex } from "rebass";
import { MotionConfig, AnimationFeature, GesturesFeature } from "framer-motion";
import ThemeProvider from "./components/theme-provider";
import Banner from "./components/banner";
import StatusBar from "./components/statusbar";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";
import GlobalMenuWrapper from "./components/globalmenuwrapper";
import { getCurrentPath, NavigationEvents } from "./navigation";
import rootroutes from "./navigation/rootroutes";
import { useStore as useEditorStore } from "./stores/editor-store";
import { Suspense } from "react";
import useMobile from "./utils/use-mobile";
import useTablet from "./utils/use-tablet";
import HashRouter from "./components/hashrouter";
import ThemeTransition from "./components/themeprovider/themetransition";

const AppEffects = React.lazy(() => import("./app-effects"));
const CachedRouter = React.lazy(() => import("./components/cached-router"));

function App() {
  const [show, setShow] = useState(true);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const clearSession = useEditorStore((store) => store.clearSession);

  useEffect(() => {
    function onNavigate() {
      NavigationEvents.unsubscribe("onNavigate", onNavigate);
      setIsAppLoaded(true);
    }
    NavigationEvents.subscribe("onNavigate", onNavigate);
  }, []);

  return (
    <MotionConfig features={[AnimationFeature, GesturesFeature]}>
      <ThemeProvider>
        {isAppLoaded && (
          <Suspense fallback={<div style={{ display: "none" }} />}>
            <AppEffects
              setShow={setShow}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </Suspense>
        )}

        <GlobalMenuWrapper />
        <Flex
          flexDirection="column"
          id="app"
          bg="background"
          height="100%"
          sx={{ overflow: "hidden" }}
        >
          <Flex flex={1} sx={{ overflow: "hidden" }}>
            <NavigationMenu
              toggleNavigationContainer={(state) => {
                if (isMobile || isTablet) {
                  clearSession();
                } else setShow(state || !show);
              }}
            />
            <Flex variant="rowFill">
              <Animated.Flex
                className="listMenu"
                variant="columnFill"
                initial={{ width: "30%", opacity: 1, x: 0 }}
                animate={{
                  width: show ? "30%" : "0%",
                  x: show ? 0 : "-30%",
                  opacity: show ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                sx={{
                  borderRight: "1px solid",
                  borderColor: "border",
                  borderRightWidth: show ? 1 : 0,
                }}
              >
                {isMobile && <Banner />}
                <Suspense fallback={<div />}>
                  <CachedRouter />
                </Suspense>
              </Animated.Flex>
              <Flex
                width={[show ? 0 : "100%", show ? 0 : "100%", "100%"]}
                flexDirection="column"
              >
                <HashRouter />
              </Flex>
            </Flex>
          </Flex>
          <StatusBar />
          <ThemeTransition />
        </Flex>
      </ThemeProvider>
    </MotionConfig>
  );
}

function Root() {
  const path = getCurrentPath();
  switch (path) {
    case "/account/verified":
      return rootroutes["/account/verified"]();
    case "/account/recovery":
      return rootroutes["/account/recovery"]();
    default:
      return <App />;
  }
}

export default Root;
