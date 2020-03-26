import React, { useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { Flex, Box } from "rebass";
import ThemeProvider from "./components/theme-provider";
import { usePersistentState } from "./utils/hooks";
import { useStore } from "./stores/app-store";
import { useStore as useAppStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import Animated from "./components/animated";
import NavigationMenu from "./components/navigationmenu";

function App() {
  const [show, setShow] = usePersistentState("isContainerVisible", true);
  const refreshColors = useStore(store => store.refreshColors);
  const isFocusModeEnabled = useAppStore(store => store.isFocusModeEnabled);
  const initUser = useUserStore(store => store.init);

  useEffect(() => {
    refreshColors();
    initUser();
  }, [refreshColors, initUser]);

  useEffect(() => {
    if (isFocusModeEnabled) {
      setShow(false);
    } else {
      setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusModeEnabled]);

  return (
    <ThemeProvider>
      <Flex bg="background" height="100%">
        <NavigationMenu toggleNavigationContainer={() => setShow(!show)} />
        <Flex flex="1 1 auto">
          <Animated.Flex
            className="RootNavigator"
            initial={{ width: "30%", opacity: 1, scaleY: 1 }}
            animate={{
              width: show ? "30%" : "0%",
              scaleY: show ? 1 : 0.8,
              opacity: show ? 1 : 0,
              zIndex: show ? 0 : -1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            flex="1 1 auto"
            flexDirection="column"
            sx={{
              borderRight: "1px solid",
              borderColor: "border"
            }}
          />
          <Editor />
        </Flex>
        <Box id="dialogContainer" />
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}
export default App;
