import React, { useEffect } from "react";
import "./app.css";
import { Flex, Box } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { usePersistentState } from "./utils/hooks";
import { useStore } from "./stores/app-store";
import { useStore as useEditorStore } from "./stores/editor-store";
import { useStore as useUserStore } from "./stores/user-store";
import { useStore as useNotesStore } from "./stores/note-store";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";
import { isMobile } from "./utils/dimensions";
import { db } from "./common";
import { useRoutes } from "hookrouter";
import routes from "./navigation/routes";
import Editor from "./components/editor";

function App() {
  const [show, setShow] = usePersistentState("isContainerVisible", true);
  const refreshColors = useStore((store) => store.refreshColors);
  const isFocusMode = useStore((store) => store.isFocusMode);
  const initUser = useUserStore((store) => store.init);
  const initNotes = useNotesStore((store) => store.init);
  const openLastSession = useEditorStore((store) => store.openLastSession);
  const sessionId = useEditorStore((store) => store.session.id);
  const routeResult = useRoutes(routes);

  useEffect(() => {
    refreshColors();
    initUser();
    initNotes();
  }, [refreshColors, initUser, initNotes]);

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
    if (!isMobile()) return;
    setShow(!sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    return () => {
      db.ev.unsubscribeAll();
    };
  }, []);

  return (
    <ThemeProvider>
      <Flex id="app" bg="background" height="100%">
        <NavigationMenu
          toggleNavigationContainer={(state) => setShow(state || !show)}
        />
        <Flex variant="rowFill">
          <Animated.Flex
            variant="columnFill"
            initial={{ width: "30%", opacity: 1, scaleY: 1 }}
            animate={{
              width: show ? "30%" : "0%",
              scaleY: show ? 1 : 0.8,
              opacity: show ? 1 : 0,
              zIndex: show ? 0 : -1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
              borderRight: "1px solid",
              borderColor: "border",
            }}
          >
            {routeResult}
          </Animated.Flex>
          <Flex width={[show ? 0 : "100%", 0, "100%"]}>
            <Editor />
          </Flex>
        </Flex>
        <Box id="dialogContainer" />
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}
export default App;
