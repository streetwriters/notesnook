import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
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
import * as Icon from "react-feather";
import { useStore as useAppStore } from "./stores/app-store";

const NavMenuItem = props => {
  const [fill, setFill] = useState();
  const [toggle, setToggle] = useState(
    props.item.isToggled && props.item.isToggled()
  );
  const theme = useTheme();
  useEffect(() => {
    setFill(toggle ? theme.colors.text : props.item.color || "transparent");
  }, [props.item, toggle, theme.colors]);
  return (
    <Button
      onClick={() => {
        props.onSelected();
        setToggle(props.item.isToggled && props.item.isToggled());
      }}
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
          strokeWidth={props.selected ? 2 : 1.3}
          style={{ marginRight: 2 }}
          fill={fill}
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

  useEffect(() => {
    RootNavigator.navigate(selectedKey);
    refreshColors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFocusModeEnabled) setShow(false);
  }, [isFocusModeEnabled, setShow, show]);
  const colors = useStore(store => store.colors);
  return (
    <ThemeProvider>
      <Flex
        bg="background"
        sx={{ color: "text" }}
        height="100%"
        alignContent="stretch"
      >
        {!isFocusModeEnabled && (
          <Flex
            flexDirection="column"
            justifyContent="space-between"
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
            </Box>
          </Flex>
        )}
        <Flex flex="1 1 auto" flexDirection="row" alignContent="stretch" px={0}>
          <Flex
            className="RootNavigator"
            style={{
              display: show ? "flex" : "none"
            }}
            sx={{
              borderRight: "1px solid",
              borderColor: "border",
              width: ["100%", "100%", "30%"]
            }}
            flexDirection="column"
            flex="1 1 auto"
            //style={{ width: "362px" }}
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
