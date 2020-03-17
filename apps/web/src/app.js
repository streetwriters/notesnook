import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { motion } from "framer-motion";
import { Flex, Box, Button, Text } from "rebass";
import { ThemeProvider } from "./utils/theme";
import RootNavigator, {
  bottomRoutes,
  routes
} from "./navigation/navigators/rootnavigator";
import "./app.css";
import { usePersistentState } from "./utils/hooks";
import { useTheme } from "emotion-theming";
import { useStore } from "./stores/app-store";
import { useStore as useNotesStore } from "./stores/note-store";
import { COLORS } from "./common";
import { toTitleCase } from "./utils/string";
import * as Icon from "./components/icons";
import { useStore as useAppStore } from "./stores/app-store";
import { useStore as useUserStore } from "./stores/user-store";
import Animated from "./components/animated";

const NavMenuItem = props => {
  return (
    <Button
      onClick={() => props.onSelected()}
      variant="nav"
      sx={{
        width: "full",
        borderRadius: "none",
        textAlign: "center",
        color: props.selected ? "primary" : props.item.color || "text",
        transition: "color 100ms, background-color 100ms linear",
        ":hover": {
          color: "primary",
          backgroundColor: "shade"
        }
      }}
      px={0}
      py={3}
    >
      <Flex
        justifyContent={["flex-start", "center", "center"]}
        alignItems="center"
        sx={{ position: "relative", marginLeft: [2, 0, 0] }}
      >
        <props.item.icon
          size={18}
          sx={{ marginRight: "2px" }}
          color={props.selected ? "primary" : props.item.color || "icon"}
        />
        <Text
          sx={{
            display: ["flex", "none", "none"],
            fontSize: 15,
            marginLeft: 1
          }}
        >
          {props.item.title}
        </Text>
        {props.item.count && (
          <Text sx={{ position: "absolute", top: -8, right: 10 }} fontSize={9}>
            {props.item.count > 99 ? "99+" : props.item.count}
          </Text>
        )}
      </Flex>
    </Button>
  );
};

function App() {
  const [selectedKey, setSelectedKey] = usePersistentState(
    "navSelectedKey",
    "home"
  );
  const [show, setShow] = usePersistentState("navContainerState", true);

  const isSideMenuOpen = useStore(store => store.isSideMenuOpen);
  const refreshColors = useStore(store => store.refreshColors);
  const setSelectedContext = useNotesStore(store => store.setSelectedContext);
  const isFocusModeEnabled = useAppStore(store => store.isFocusModeEnabled);
  const initUser = useUserStore(store => store.init);

  useEffect(() => {
    RootNavigator.navigate(selectedKey);
    refreshColors();
    initUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFocusModeEnabled) {
      setShow(false);
    } else {
      setShow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusModeEnabled]);

  const colors = useStore(store => store.colors);
  const isLoggedIn = useUserStore(store => store.isLoggedIn);
  return (
    <ThemeProvider>
      <Flex
        bg="background"
        sx={{ color: "text" }}
        height="100%"
        alignContent="stretch"
      >
        <Animated.Flex
          flexDirection="column"
          justifyContent="space-between"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFocusModeEnabled ? 0 : 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          sx={{
            zIndex: 999,
            borderRight: "1px solid",
            borderRightColor: "primary",
            minWidth: ["85%", 50, 50],
            maxWidth: ["85%", 50, 50],
            display: [isSideMenuOpen ? "flex" : "none", "flex", "flex"],
            position: ["absolute", "relative", "relative"]
          }}
          bg={"background"}
          px={0}
        >
          <Box
            sx={{
              overflow: "scroll",
              scrollbarWidth: "none",
              //TODO: need to test this on webkit and internet explorer
              "::-webkit-scrollbar": { width: 0, height: 0 },
              msOverflowStyle: "none"
              //"-ms-overflow-style": "none"
            }}
          >
            {Object.values(routes).map((item, index) => (
              <NavMenuItem
                onSelected={async () => {
                  if (selectedKey === item.key) {
                    setShow(!show);
                    return;
                  }
                  if (item.onClick) {
                    setSelectedKey(item.key);
                    return item.onClick();
                  }
                  if (RootNavigator.navigate(item.key)) {
                    setSelectedKey(item.key);
                  }
                }}
                key={item.key}
                item={item}
                selected={selectedKey === item.key}
              />
            ))}
            {colors.map(color => {
              return (
                <NavMenuItem
                  onSelected={async () => {
                    setSelectedKey(undefined);
                    setSelectedContext({
                      type: "color",
                      value: color.title
                    });
                    RootNavigator.navigate(
                      "color",
                      {
                        title: toTitleCase(color.title),
                        context: { colors: [color.title] }
                      },
                      true
                    );
                  }}
                  key={color.title}
                  item={{
                    color: COLORS[color.title],
                    title: toTitleCase(color.title),
                    icon: Icon.Circle,
                    count: color.count
                  }}
                />
              );
            })}
          </Box>
          <Box>
            {Object.values(bottomRoutes).map((item, index) => (
              <NavMenuItem
                onSelected={async () => {
                  if (item.onClick) {
                    item.onClick();
                    if (item.component) setSelectedKey(item.key);
                    return;
                  }
                  if (RootNavigator.navigate(item.key)) {
                    setSelectedKey(item.key);
                  }
                }}
                key={item.key}
                item={item}
                selected={selectedKey === item.key}
              />
            ))}
          </Box>
        </Animated.Flex>
        <Flex flex="1 1 auto" flexDirection="row" alignContent="stretch" px={0}>
          <motion.div
            initial={{ width: "30%", opacity: 1, scaleY: 1 }}
            animate={{
              width: show ? "30%" : "0%",
              scaleY: show ? 1 : 0.8,
              opacity: show ? 1 : 0,
              zIndex: show ? 0 : -1
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              display: "flex",
              flex: "1 1 auto"
            }}
          >
            <Flex
              className="RootNavigator"
              flex="1 1 auto"
              flexDirection="column"
              sx={{
                borderRight: "1px solid",
                borderColor: "border"
              }}
            />
          </motion.div>
          <Editor />
        </Flex>
        <Box id="dialogContainer" />
        <Box id="snackbarContainer" />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
