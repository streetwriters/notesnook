import React, { useState, useEffect } from "react";
import "./app.css";
import Editor from "./components/editor";
import { Flex, Box, Button, Text } from "rebass";
import { ThemeProvider } from "./utils/theme";
import RootNavigator from "./navigation/navigators/rootnavigator";
import "./app.css";
import { usePersistentState } from "./utils/hooks";
import { ev } from "./common";

const NavMenuItem = props => {
  return (
    <Button
      onClick={props.onSelected}
      variant="nav"
      sx={{
        width: "full",
        borderRadius: "none",
        borderLeft: props.selected && "3px solid",
        borderColor: "primary",
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
          size={24}
          strokeWidth={props.item.color ? 0 : props.selected ? 2 : 1.3}
          style={{ marginRight: 2 }}
          fill={props.item.color || "transparent"}
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
function getNavigationViewWidth() {
  return window.localStorage.getItem("navigationViewWidth");
}
function App() {
  const [selectedIndex, setSelectedIndex] = usePersistentState(
    "navSelectedIndex",
    0
  );
  const [show, setShow] = usePersistentState("navContainerState", true);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  useEffect(() => {
    RootNavigator.navigate(Object.keys(RootNavigator.routes)[selectedIndex]);
    function openSideMenu() {
      setSideMenuOpen(true);
    }
    ev.addListener("openSideMenu", openSideMenu);
    return () => {
      ev.removeListener("openSideMenu", openSideMenu);
    };
  }, []);
  return (
    <ThemeProvider>
      <Flex
        bg="background"
        sx={{ color: "text" }}
        height="100%"
        alignContent="stretch"
      >
        <Box
          sx={{
            zIndex: 999,
            borderRight: "1px solid",
            borderRightColor: "primary",
            minWidth: ["85%", 60, 60],
            maxWidth: ["85%", 60, 60],
            display: [sideMenuOpen ? "block" : "none", "block", "block"],
            position: ["absolute", "relative", "relative"]
          }}
          bg={"shade"}
          px={0}
        >
          {Object.values(RootNavigator.routes).map((item, index) => (
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
          ))}
        </Box>
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
            onDragEnd={e => {
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
