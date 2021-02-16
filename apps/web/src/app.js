import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "./app.css";
import { Flex } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import { useStore as useEditorStore } from "./stores/editor-store";
import { useStore as useThemeStore } from "./stores/theme-store";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";
import routes from "./navigation/routes";
import Editor from "./components/editor";
import useMobile from "./utils/use-mobile";
import GlobalMenuWrapper from "./components/globalmenuwrapper";
import { resetReminders } from "./common/reminders";
import { isUserPremium } from "./common";
import { db } from "./common/db";
import { CHECK_IDS, EV, EVENTS } from "notes-core/common";
import useTablet from "./utils/use-tablet";
import { showBuyDialog } from "./common/dialog-controller";
import Banner from "./components/banner";
import StatusBar from "./components/statusbar";
import useRoutes from "./utils/use-routes";
import useHashRoutes from "./utils/use-hash-routes";
import hashroutes from "./navigation/hash-routes";
import rootroutes from "./navigation/rootroutes";
import { getCurrentPath, NavigationEvents } from "./navigation";
import useVersion, { getCachedVersion } from "./utils/useVersion";
import {
  showAppAvailableNotice,
  showAppUpdatedNotice,
} from "./common/dialog-controller";
import { useAnimation } from "framer-motion";
import RouteContainer from "./components/route-container";
import { MotionConfig, AnimationFeature, GesturesFeature } from "framer-motion";

function App() {
  const [show, setShow] = useState(true);
  const refreshColors = useStore((store) => store.refreshColors);
  const refreshMenuPins = useStore((store) => store.refreshMenuPins);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const isEditorOpen = useStore((store) => store.isEditorOpen);
  const clearSession = useEditorStore((store) => store.clearSession);
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  const version = useVersion();
  const isMobile = useMobile();
  const isTablet = useTablet();

  useEffect(() => {
    (async function () {
      const cached = getCachedVersion();
      if (!cached) return;
      if (cached.appUpdated) await showAppUpdatedNotice(cached);
      else if (cached.appUpdateable) await showAppAvailableNotice(cached);
    })();
  }, [version]);

  useEffect(
    function initializeApp() {
      refreshColors();
      refreshMenuPins();
      initUser();
      initNotes();
      (async function () {
        await resetReminders();
        setIsVaultCreated(await db.vault.exists());
      })();
    },
    [
      refreshColors,
      refreshMenuPins,
      initUser,
      initNotes,
      addReminder,
      setIsVaultCreated,
    ]
  );

  useEffect(() => {
    EV.subscribe(EVENTS.userCheckStatus, async (type) => {
      if (process.env.REACT_APP_CI) return { type, result: true };
      if (isUserPremium()) {
        return { type, result: true };
      } else {
        if (type !== CHECK_IDS.databaseSync) await showBuyDialog(type);
        return { type, result: false };
      }
    });
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      setShow(false);
    } else {
      if (!isTablet) setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    if (!isMobile && !isTablet) return;
    setShow(!isEditorOpen);
    //setIsEditorOpen(!show);
    // if (isTablet) toggleSideMenu(!isEditorOpen);
    // if (!isEditorOpen && !isTablet && !isMobile) toggleSideMenu(true);
    // // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditorOpen, isMobile, isTablet]);

  useEffect(() => {
    return () => {
      EV.unsubscribeAll();
    };
  }, []);

  useEffect(() => {
    toggleSideMenu(!isMobile);
    if (!isMobile && !isTablet) setShow(true);
  }, [isMobile, isTablet, toggleSideMenu]);

  return (
    <MotionConfig features={[AnimationFeature, GesturesFeature]}>
      <ThemeProvider>
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
                if (isMobile || isTablet) clearSession();
                else setShow(state || !show);
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
                <CachedRouter />
              </Animated.Flex>
              <Flex
                width={[show ? 0 : "100%", show ? 0 : "100%", "100%"]}
                flexDirection="column"
              >
                <EditorSwitch />
              </Flex>
            </Flex>
            <GlobalMenuWrapper />
          </Flex>
          <StatusBar />
          <ThemeTransition />
        </Flex>
      </ThemeProvider>
    </MotionConfig>
  );
}

const cache = {};
function CachedRouter() {
  const RouteResult = useRoutes(routes, { fallbackRoute: "/" });
  useEffect(() => {
    NavigationEvents.publish("onNavigate", RouteResult);

    const key = RouteResult.key || "general";
    const routeContainer = document.getElementById("mainRouteContainer");
    routeContainer.childNodes.forEach((node) => {
      node.style.display = "none";
    });

    var route = document.getElementById(key);
    if (route) {
      route.style.display = "flex";
      if (key !== "general") return;
    }

    if (!cache[key] || !route) {
      if (!route) {
        cache[key] = true;
        route = document.createElement("div");
        route.id = key;
        route.className = "route";
        routeContainer.appendChild(route);
      }
      ReactDOM.render(
        <ThemeProvider>{RouteResult.component}</ThemeProvider>,
        route
      );
    }
  }, [RouteResult]);

  return (
    <RouteContainer
      id="mainRouteContainer"
      type={RouteResult?.type}
      title={RouteResult?.title}
      subtitle={RouteResult?.subtitle}
      buttons={RouteResult?.buttons}
    />
  );
}

function EditorSwitch() {
  const routeResult = useHashRoutes(hashroutes);
  return routeResult || <Editor />;
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

export default Root;
