import React, { useEffect, useState } from "react";
import "./app.css";
import { Flex } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { useStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";
import routes from "./navigation/routes";
import Editor from "./components/editor";
import useMobile from "./utils/use-mobile";
import GlobalMenuWrapper from "./components/globalmenuwrapper";
import { resetReminders } from "./common/reminders";
import { db, isUserPremium } from "./common";
import { EV } from "notes-core/common";
import useTablet from "./utils/use-tablet";
import { showBuyDialog } from "./components/dialogs/buy-dialog";
import Banner from "./components/banner";
import {
  showAccountDeletedNotice,
  showPasswordChangedNotice,
} from "./components/dialogs/confirm";
import StatusBar from "./components/statusbar";
import useRoutes from "./utils/use-routes";
import useHashRoutes from "./utils/use-hash-routes";
import hashroutes from "./navigation/hash-routes";
import rootroutes from "./navigation/rootroutes";
import { getCurrentPath } from "./navigation";

function App() {
  const [show, setShow] = useState(true);
  const refreshColors = useStore((store) => store.refreshColors);
  const refreshMenuPins = useStore((store) => store.refreshMenuPins);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const isEditorOpen = useStore((store) => store.isEditorOpen);
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const setIsVaultCreated = useStore((store) => store.setIsVaultCreated);
  const isMobile = useMobile();
  const isTablet = useTablet();

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
    EV.subscribe("user:checkStatus", async (type) => {
      if (process.env.REACT_APP_CI) return { type, result: true };
      if (isUserPremium()) {
        return { type, result: true };
      } else {
        await showBuyDialog();
        return { type, result: false };
      }
    });
    EV.subscribe("user:deleted", async () => {
      await showAccountDeletedNotice();
    });
    EV.subscribe("user:passwordChanged", async () => {
      await showPasswordChangedNotice();
    });
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      setShow(false);
    } else {
      setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusMode]);

  useEffect(() => {
    if (!isMobile && !isTablet) return;
    setShow(!isEditorOpen);
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
  console.log("ROUTING!");
  return (
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
            toggleNavigationContainer={(state) => setShow(state || !show)}
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
              <Routes />
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
      </Flex>
    </ThemeProvider>
  );
}

function Routes() {
  const routeResult = useRoutes(routes, { fallbackRoute: "/" });
  return routeResult || null;
}

function EditorSwitch() {
  const routeResult = useHashRoutes(hashroutes);
  return routeResult || <Editor />;
}

function Root() {
  const path = getCurrentPath();
  switch (path) {
    case "/account/confirmed":
      return rootroutes["/account/confirmed"]();
    case "/account/recovery":
      return rootroutes["/account/recovery"]();
    default:
      return <App />;
  }
}

export default Root;
