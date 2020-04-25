import React, { useEffect } from "react";
import "./app.css";
import { Flex, Box } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { usePersistentState } from "./utils/hooks";
import { useStore } from "./stores/app-store";
import { useStore as useAppStore } from "./stores/app-store";
import { useStore as useEditorStore } from "./stores/editor-store";
import { useStore as useUserStore } from "./stores/user-store";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";
import NavigationContainer from "./navigation/container";
import RootNavigator from "./navigation/navigators/rootnavigator";
import EditorNavigator from "./navigation/navigators/editornavigator";
import { isMobile } from "./utils/dimensions";

function App() {
  const [show, setShow] = usePersistentState("isContainerVisible", true);
  const refreshColors = useStore((store) => store.refreshColors);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const initUser = useUserStore((store) => store.init);
  const openLastSession = useEditorStore((store) => store.openLastSession);

  useEffect(() => {
    refreshColors();
    initUser();
  }, [refreshColors, initUser]);

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
    EditorNavigator.onNavigate = (route) => {
      setShow(!!!route);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider>
      <Flex id="app" bg="background" height="100%">
        <NavigationMenu toggleNavigationContainer={() => setShow(!show)} />
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
            <NavigationContainer
              navigator={RootNavigator}
              variant="columnFill"
            />
          </Animated.Flex>
          <Flex
            width={[show ? 0 : "100%", 0, "100%"]}
            className="EditorNavigator"
          />
        </Flex>
        <Box id="dialogContainer" />
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}
export default App;
