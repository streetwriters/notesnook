import React, { useEffect, useState } from "react";
import "./app.css";
import { Flex, Box, Text } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { useStore } from "./stores/app-store";
import { useStore as useEditorStore } from "./stores/editor-store";
import {
  store as userstore,
  useStore as useUserStore,
} from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";
import { useRoutes } from "hookrouter";
import routes from "./navigation/routes";
import Editor from "./components/editor";
import useMobile from "./utils/use-mobile";
import GlobalMenuWrapper from "./components/globalmenuwrapper";
import {
  shouldAddBackupReminder,
  shouldAddSignupReminder,
} from "./common/reminders";
import { EV } from "notes-core/common";
import useTablet from "./utils/use-tablet";
import { showBuyDialog } from "./components/dialogs/buy-dialog";

function App() {
  const [show, setShow] = useState(true);
  const refreshColors = useStore((store) => store.refreshColors);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const addReminder = useStore((store) => store.addReminder);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const openLastSession = useEditorStore((store) => store.openLastSession);
  const isEditorOpen = useStore((store) => store.isEditorOpen);
  const toggleSideMenu = useStore((store) => store.toggleSideMenu);
  const isMobile = useMobile();
  const isTablet = useTablet();
  const routeResult = useRoutes(routes);

  useEffect(
    function initializeApp() {
      refreshColors();
      initUser();
      initNotes();
      (async function () {
        if (await shouldAddBackupReminder()) {
          addReminder("backup", "high");
        }
        if (await shouldAddSignupReminder()) {
          addReminder("signup", "low");
        }
      })();
    },
    [refreshColors, initUser, initNotes, addReminder]
  );

  useEffect(() => {
    EV.subscribe("user:checkStatus", async (type) => {
      // const subStatus = userstore.get().user?.subscription?.status;
      // if (subStatus && subStatus >= 1 && subStatus <= 3) {
      //   return { type, result: true };
      // } else {
      //   await showBuyDialog();
      //   return { type, result: false };
      // }
      return { type, result: true };
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
    openLastSession();
  }, [openLastSession]);

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

  return (
    <ThemeProvider>
      <Flex id="app" bg="background" height="100%">
        <NavigationMenu
          toggleNavigationContainer={(state) => setShow(state || !show)}
        />
        <Flex variant="rowFill">
          <Animated.Flex
            variant="columnFill"
            initial={{ width: "30%", opacity: 1, x: 0 }}
            animate={{
              width: show ? "30%" : "0%",
              x: show ? 0 : "-30%",
              opacity: show ? 1 : 0,
              zIndex: show ? 0 : -1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
              borderRight: "1px solid",
              borderColor: "border",
            }}
          >
            {isMobile && (
              <Flex
                alignItems="center"
                justifyContent="center"
                bg="primary"
                width="100%"
                py={1}
              >
                <Text color="static" textAlign="center" fontSize="title">
                  Use our <a href="https://notesnook.com/mobile">mobile app</a>{" "}
                  for a better experience.
                </Text>
              </Flex>
            )}
            {routeResult}
          </Animated.Flex>
          <Flex
            width={[show ? 0 : "100%", show ? 0 : "100%", "100%"]}
            flexDirection="column"
          >
            <Editor />
          </Flex>
        </Flex>
        <Box id="dialogContainer" />
        <GlobalMenuWrapper />
      </Flex>
    </ThemeProvider>
  );
}
export default App;
