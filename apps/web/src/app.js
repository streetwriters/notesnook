import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { Flex, Box, Button, Text } from "rebass";
import { ThemeProvider } from "./utils/theme";
import RootNavigator from "./navigation/navigators/rootnavigator";
import "./app.css";
import { usePersistentState } from "./utils/hooks";
import { useTheme } from "emotion-theming";
import useStore from "./common/store";

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
        transition: "color 100ms linear",
        ":hover": {
          color: "primary"
        }
      }}
      px={0}
      py={3}
    >
      <Flex
        justifyContent={["flex-start", "center", "center"]}
        alignItems="center"
        sx={{ marginLeft: [2, 0, 0] }}
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
      </Flex>
    </Button>
  );
};

var startX, startWidth;

function App() {
  const [selectedIndex, setSelectedIndex] = usePersistentState(
    "navSelectedIndex",
    0
  );
  const [show, setShow] = usePersistentState("navContainerState", true);

  const isSideMenuOpen = useStore(state => state.isSideMenuOpen);
  useEffect(() => {
    RootNavigator.navigate(Object.keys(RootNavigator.routes)[selectedIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ThemeProvider>
      <Flex
        bg="background"
        sx={{ color: "text" }}
        height="100%"
        alignContent="stretch"
      >
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
            position: ["absolute", "relative", "relative"],
            overflow: "scroll",
            scrollbarWidth: "none",
            //TODO: need to test this on webkit and internet explorer
            "::-webkit-scrollbar": { width: 0, height: 0 },
            msOverflowStyle: "none"
            //"-ms-overflow-style": "none"
          }}
          bg={"shade"}
          px={0}
        >
          <Box>
            {Object.values(RootNavigator.routes).map(
              (item, index) =>
                !item.bottom && (
                  <NavMenuItem
                    onSelected={async () => {
                      if (item.onClick) {
                        return item.onClick();
                      }
                      if (selectedIndex === index) {
                        setShow(!show);
                        return;
                      }
                      if (RootNavigator.navigate(item.key)) {
                        setSelectedIndex(index);
                      }
                    }}
                    key={item.key}
                    item={item}
                    selected={selectedIndex === index}
                  />
                )
            )}
          </Box>
          <Box>
            {Object.values(RootNavigator.routes).map(
              (item, index) =>
                item.bottom && (
                  <NavMenuItem
                    onSelected={async () => {
                      if (item.onClick) {
                        return item.onClick();
                      }
                      if (selectedIndex === index) {
                        setShow(!show);
                        return;
                      }
                      if (RootNavigator.navigate(item.key)) {
                        setSelectedIndex(index);
                      }
                    }}
                    key={item.key}
                    item={item}
                    selected={selectedIndex === index}
                  />
                )
            )}
          </Box>
        </Flex>
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
          <Box
            className="resize-handle"
            bg="border"
            sx={{
              width: 5,
              display: ["none", "none", show ? "block" : "none"],
              opacity: 0,
              cursor: "col-resize"
            }}
            draggable={true}
            onMouseDown={e => {
              startX = e.clientX;
              let view = document
                .querySelector(".RootNavigator")
                .getBoundingClientRect();
              startWidth = parseInt(view.width, 10);
            }}
            onDrag={e => {
              let view = document.querySelector(".RootNavigator");
              view.style.width = `${startWidth + e.clientX - startX}px`;
            }}
            onDragEnd={() => {
              let view = document.querySelector(".RootNavigator");
              view.style.width = view.getBoundingClientRect().width;
              window.localStorage.setItem(
                "navigationViewWidth",
                view.style.width
              );
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
